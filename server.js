const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 5000;

const path = require("path");

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

const db = mysql.createConnection({
  host: "localhost",
  user: "root", 
  password: "Saiteja@4741", 
  database: "rtp",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;
  const table = role === "student" ? "students" : "teachers";

  const query = `SELECT * FROM ${table} WHERE email = ?`;
  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.json({ error: "Database error" });
    }
    if (results.length > 0) {
      const user = results[0];
      let isPasswordValid = false;
      if (user.password.startsWith('$')) {
        // Hashed password
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        // Plain text password (for existing data)
        isPasswordValid = password === user.password;
      }
      if (isPasswordValid) {
        res.json({ user });
      } else {
        res.json({ error: "Invalid email or password" });
      }
    } else {
      res.json({ error: "Invalid email or password" });
    }
  });
});

app.get("/student/:id", (req, res) => {
  const studentId = req.params.id;

  const query = `
        SELECT s.*,
            (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = 'Present') AS attendance_count,
            (SELECT GROUP_CONCAT(CONCAT(subject, ':', cnt) SEPARATOR ', ')
             FROM (SELECT subject, COUNT(*) as cnt FROM attendance WHERE student_id = s.id AND status = 'Present' GROUP BY subject) as temp) AS attendance_per_subject,
            (SELECT GROUP_CONCAT(CONCAT(subject, ' (', exam_type, '): ', marks_obtained, '/', total_marks) SEPARATOR ', ')
             FROM marks WHERE student_id = s.id) AS marks
        FROM students s
        WHERE s.id = ?`;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      return res.json({ error: "Database error" });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.json({ error: "Student not found" });
    }
  });
});

app.get("/teacher/:id", (req, res) => {
  const teacherId = req.params.id;

  const query = `
        SELECT t.*, 
            (SELECT GROUP_CONCAT(CONCAT(day, ' ', start_time, '-', end_time, ' (', subject, ') in ', classroom) SEPARATOR ', ') 
             FROM timetable WHERE teacher_id = t.id) AS schedule
        FROM teachers t
        WHERE t.id = ?`;

  db.query(query, [teacherId], (err, results) => {
    if (err) {
      return res.json({ error: "Database error" });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.json({ error: "Teacher not found" });
    }
  });
});

app.post("/marks", (req, res) => {
  const { teacher_id, student_id, rollno, subject, exam_type, marks_obtained, total_marks } =
    req.body;

  let effectiveStudentId = student_id;
  if (rollno && !student_id) {
    const lookupQuery = `SELECT id FROM students WHERE rollno = ?`;
    db.query(lookupQuery, [rollno], (err, results) => {
      if (err) {
        return res.json({ error: "Database error" });
      }
      if (results.length === 0) {
        return res.json({ error: "Student not found for rollno" });
      }
      effectiveStudentId = results[0].id;
      const insertQuery = `INSERT INTO marks (student_id, subject, marks_obtained, total_marks, exam_type) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), total_marks = VALUES(total_marks)`;
      db.query(insertQuery, [effectiveStudentId, subject, marks_obtained, total_marks, exam_type], (err) => {
        if (err) {
          return res.json({ error: "Database error" });
        }
        res.json({ message: "Marks added successfully" });
      });
    });
    return; // Exit early since async query started
  } else if (!effectiveStudentId) {
    return res.json({ error: "Student ID or rollno required" });
  }

  const query = `INSERT INTO marks (student_id, subject, marks_obtained, total_marks, exam_type) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), total_marks = VALUES(total_marks)`;
  db.query(query, [effectiveStudentId, subject, marks_obtained, total_marks, exam_type], (err) => {
    if (err) {
      return res.json({ error: "Database error" });
    }
    res.json({ message: "Marks added successfully" });
  });
});

app.get("/subjects", (req, res) => {
  const { department, year, semester } = req.query;
  let query = `SELECT subject_name FROM subjects WHERE 1=1`;
  const params = [];
  if (department) {
    query += ` AND department = ?`;
    params.push(department);
  }
  if (year) {
    query += ` AND year = ?`;
    params.push(year);
  }
  if (semester) {
    query += ` AND semester = ?`;
    params.push(semester);
  }
  db.query(query, params, (err, results) => {
    if (err) {
      return res.json({ error: "Database error" });
    }
    res.json(results.map(r => r.subject_name));
  });
});

app.post("/marks/bulk", (req, res) => {
  const marks = req.body; // array of {student_id, subject, exam_type, marks_obtained, total_marks}
  if (!Array.isArray(marks) || marks.length === 0) return res.status(400).json({ message: 'Invalid data' });
  const query = 'INSERT INTO marks (student_id, subject, marks_obtained, total_marks, exam_type) VALUES ? ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), total_marks = VALUES(total_marks)';
  const values = marks.map(m => [m.student_id, m.subject, m.marks_obtained, m.total_marks, m.exam_type]);
  db.query(query, [values], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Marks added successfully' });
  });
});

app.get("/students", (req, res) => {
  const { department, year, semester, section } = req.query;
  let query = `SELECT * FROM students WHERE 1=1`;
  const params = [];
  if (department) {
    query += ` AND department = ?`;
    params.push(department);
  }
  if (year) {
    query += ` AND year = ?`;
    params.push(year);
  }
  if (semester) {
    query += ` AND semester = ?`;
    params.push(semester);
  }
  if (section) {
    query += ` AND section = ?`;
    params.push(section);
  }
  db.query(query, params, (err, results) => {
    if (err) {
      return res.json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get("/student-by-rollno", (req, res) => {
  const { rollno } = req.query;
  if (!rollno) return res.status(400).json({ message: 'Rollno required' });
  const query = `SELECT * FROM students WHERE rollno = ?`;
  db.query(query, [rollno], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json(results[0]);
  });
});

app.post("/attendance", (req, res) => {
  const { teacher_id, student_id, status } = req.body;

  const query = `INSERT INTO attendance (student_id, date, status) VALUES (?, CURDATE(), ?)`;
  db.query(query, [student_id, status], (err) => {
    if (err) {
      return res.json({ error: "Database error" });
    }
    res.json({ message: "Attendance marked successfully" });
  });
});

app.post("/attendance/bulk", (req, res) => {
  const attendance = req.body; // array of {student_id, subject, status}
  if (!Array.isArray(attendance) || attendance.length === 0) return res.status(400).json({ message: 'Invalid data' });
  const query = 'INSERT INTO attendance (student_id, subject, date, status) VALUES ?';
  const values = attendance.map(a => [a.student_id, a.subject, new Date().toISOString().split('T')[0], a.status]);
  db.query(query, [values], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Attendance added successfully' });
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "intro.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
