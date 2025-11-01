const mysql = require("mysql");
require("dotenv").config();

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
        console.log("Connected to MySQL Database");
    }
});

module.exports = db;