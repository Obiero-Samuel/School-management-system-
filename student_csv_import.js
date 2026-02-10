// student_csv_import.js
// Node.js script to import students from CSV into MySQL

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

const csvFilePath = path.join(__dirname, 'List of Active Students.csv');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function importStudents() {
  const connection = await mysql.createConnection(dbConfig);
  const students = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      students.push(row);
    })
    .on('end', async () => {
      for (const student of students) {
        try {
          const values = [
            student.student_id || null,
            student.first_name || null,
            student.middle_name || null,
            student.surname || null,
            student.admission_date || null,
            student.sex || null,
            student.status || null,
            student.sponsor_type || null,
            student.religion || null,
            student.nationality || null,
            student.grade_level || null,
            student.grand_fee_charged || null,
            student.grand_fee_adjusted || null,
            student.grand_fee_paid || null,
            student.grand_balance || null
          ];
          await connection.execute(
            `INSERT INTO students (
              student_id, first_name, middle_name, surname, admission_date, sex, status, sponsor_type, religion, nationality, grade_level, grand_fee_charged, grand_fee_adjusted, grand_fee_paid, grand_balance
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values
          );
        } catch (err) {
          console.error('Error inserting student:', student.student_id, err.message);
        }
      }
      await connection.end();
      console.log('Student import complete.');
    });
}

importStudents();
