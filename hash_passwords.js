const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Saiteja@4741",
    database: "rtp",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to database");
});

const users = [{
        name: "sathvika",
        email: "sathvika@example.com",
        password: "password1",
        department: "Computer Science",
        section: "A",
        phone: "1234567890",
        address: "123 Maple St",
        role: "student",
    },
    {
        name: "abc",
        email: "abc@example.com",
        password: "password2",
        department: "Mechanical Engineering",
        section: "B",
        phone: "1234567891",
        address: "456 Oak St",
        role: "student",
    },
    {
        name: "rrr",
        email: "rrr.m@example.com",
        password: "pass6",
        subject: "Mathematics",
        department: "Computer Science",
        phone: "9876543210",
        address: "111 Red St",
        role: "teacher",
    },
    {
        name: "sss",
        email: "sss.w@example.com",
        password: "pass7",
        subject: "Physics",
        department: "Mechanical Engineering",
        phone: "9876543211",
        address: "222 Blue St",
        role: "teacher",
    },
];

async function insertOrUpdateUsers() {
    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        if (user.role === "student") {
            db.query(
                "SELECT * FROM students WHERE email = ?", [user.email],
                (err, results) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    if (results.length > 0) {
                        // Update existing user
                        db.query(
                            "UPDATE students SET password = ? WHERE email = ?", [hashedPassword, user.email],
                            (err) => {
                                if (err) console.error(err);
                                else
                                    console.log(`Updated password for ${user.email} (student)`);
                            }
                        );
                    } else {
                        // Insert new user
                        db.query(
                            "INSERT INTO students (name, email, password, department, section, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)", [
                                user.name,
                                user.email,
                                hashedPassword,
                                user.department,
                                user.section,
                                user.phone,
                                user.address,
                            ],
                            (err) => {
                                if (err) console.error(err);
                                else console.log(`Inserted ${user.email} as student`);
                            }
                        );
                    }
                }
            );
        } else {
            db.query(
                "SELECT * FROM teachers WHERE email = ?", [user.email],
                (err, results) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    if (results.length > 0) {
                        // Update existing user
                        db.query(
                            "UPDATE teachers SET password = ? WHERE email = ?", [hashedPassword, user.email],
                            (err) => {
                                if (err) console.error(err);
                                else
                                    console.log(`Updated password for ${user.email} (teacher)`);
                            }
                        );
                    } else {
                        // Insert new user
                        db.query(
                            "INSERT INTO teachers (name, email, password, subject, department, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)", [
                                user.name,
                                user.email,
                                hashedPassword,
                                user.subject,
                                user.department,
                                user.phone,
                                user.address,
                            ],
                            (err) => {
                                if (err) console.error(err);
                                else console.log(`Inserted ${user.email} as teacher`);
                            }
                        );
                    }
                }
            );
        }
    }
}

insertOrUpdateUsers();