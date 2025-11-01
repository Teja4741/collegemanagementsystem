const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db"); 
const router = express.Router();

router.post("/teacher/register", async(req, res) => {
    const { name, email, password, subject, department, phone, address } =
    req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const query =
            "INSERT INTO teachers (name, email, password, subject, department, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(
            query, [name, email, hashedPassword, subject, department, phone, address],
            (err, result) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ error: "Database error", details: err });
                }
                res.status(201).json({ message: "Teacher registered successfully!" });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Error hashing password" });
    }
});

module.exports = router;