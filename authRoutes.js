const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");
const router = express.Router();

const SECRET_KEY = "your_secret_key";

router.post("/student/login", (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT * FROM students WHERE email = ?";
    db.query(query, [email], async(err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const student = results[0];

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ id: student.id, role: "student" }, SECRET_KEY, {
            expiresIn: "1h",
        });

        res.json({
            message: "Login successful",
            token,
            studentData: {
                id: student.id,
                name: student.name,
                email: student.email,
                department: student.department,
                section: student.section,
                phone: student.phone,
                address: student.address,
            },
            redirectUrl: `/student-dashboard/${student.id}`,
        });
    });
});

router.post("/teacher/login", (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT * FROM teachers WHERE email = ?";
    db.query(query, [email], async(err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const teacher = results[0];

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ id: teacher.id, role: "teacher" }, SECRET_KEY, {
            expiresIn: "1h",
        });

        res.json({
            message: "Login successful",
            token,
            teacherData: {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                subject: teacher.subject,
                department: teacher.department,
                phone: teacher.phone,
                address: teacher.address,
            },
            redirectUrl: `/teacher-dashboard/${teacher.id}`,
        });
    });
});

module.exports = router;