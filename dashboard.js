const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

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
        console.log("Connected to database");
    }
});

const SECRET_KEY = "your_secret_key";

app.post("/login", (req, res) => {
    const { email, password, role } = req.body;

    let table = role === "student" ? "students" : "teachers";

    db.query(
        `SELECT * FROM ${table} WHERE email = ?`, [email],
        async(err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            if (results.length === 0)
                return res.status(401).json({ message: "Invalid email or password" });

            const user = results[0];

            const match = await bcrypt.compare(password, user.password);
            if (!match)
                return res.status(401).json({ message: "Invalid email or password" });

            const token = jwt.sign({ id: user.id, role }, SECRET_KEY, {
                expiresIn: "1h",
            });

            res.json({ token, role, user });
        }
    );
});

app.get("/student/dashboard", (req, res) => {
    const { student_id } = req.query;

    db.query(
        "SELECT * FROM students WHERE id = ?", [student_id],
        (err, studentResults) => {
            if (err) return res.status(500).json({ error: err.message });

            db.query(
                "SELECT * FROM marks WHERE student_id = ?", [student_id],
                (err, marksResults) => {
                    if (err) return res.status(500).json({ error: err.message });

                    db.query(
                        "SELECT * FROM attendance WHERE student_id = ?", [student_id],
                        (err, attendanceResults) => {
                            if (err) return res.status(500).json({ error: err.message });

                            res.json({
                                student: studentResults[0],
                                marks: marksResults,
                                attendance: attendanceResults,
                            });
                        }
                    );
                }
            );
        }
    );
});

app.get("/teacher/dashboard", (req, res) => {
    const { teacher_id } = req.query;

    db.query(
        "SELECT * FROM teachers WHERE id = ?", [teacher_id],
        (err, teacherResults) => {
            if (err) return res.status(500).json({ error: err.message });

            db.query(
                "SELECT * FROM timetable WHERE teacher_id = ?", [teacher_id],
                (err, timetableResults) => {
                    if (err) return res.status(500).json({ error: err.message });

                    res.json({ teacher: teacherResults[0], timetable: timetableResults });
                }
            );
        }
    );
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});