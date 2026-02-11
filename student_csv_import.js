const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function importStudents() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  // Remove all current students
  await pool.execute('DELETE FROM students');

  const results = [];
  let imported = 0;
  let skipped = 0;
  fs.createReadStream('List of Active Students.csv')
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      for (const student of results) {
        // Map and sanitize values
        const student_id = student['student_id'] || null;
        const first_name = student['first_name'] || null;
        const middle_name = student['middle_name'] || null;
        const surname = student['surname'] || null;
        const admission_date = student['admission_date'] || null;
        const sex = student['sex'] || null;
        const status = student['status'] || null;
        // Handle study_type (trailing comma)
        const study_type = student['study_type,'] || student['study_type'] || null;
        const sponsor_type = student['sponsor_type'] || null;
        const religion = student['religion'] || null;
        const nationality = student['nationality'] || null;
        // Map recent_stream to grade_level
        const grade_level = student['recent_stream'] || null;
        // Sanitize numeric fields (remove commas/quotes)
        function sanitizeNum(val) {
          if (!val) return null;
          return parseFloat(val.toString().replace(/[^\d.-]/g, ''));
        }
        const grand_fee_charged = sanitizeNum(student['grand_fee_charged']);
        const grand_fee_adjusted = sanitizeNum(student['grand_fee_adjusted']);
        const grand_fee_paid = sanitizeNum(student['grand_fee_paid']);
        const grand_balance = sanitizeNum(student['grand_balance']);
        // Skip if student_id or first_name is missing
        if (!student_id || !first_name) {
          skipped++;
          console.error('Skipping row: missing student_id or first_name', student);
          continue;
        }
        try {
          await pool.execute(
            `INSERT INTO students (student_id, first_name, middle_name, surname, admission_date, sex, status, sponsor_type, religion, nationality, grade_level, grand_fee_charged, grand_fee_adjusted, grand_fee_paid, grand_balance)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id, first_name, middle_name, surname, admission_date, sex, status, sponsor_type, religion, nationality, grade_level, grand_fee_charged, grand_fee_adjusted, grand_fee_paid, grand_balance]
          );
          imported++;
        } catch (err) {
          skipped++;
          console.error('Error inserting student:', student_id, err.message);
        }
      }
      console.log(`Student import complete. Imported: ${imported}, Skipped: ${skipped}`);
      process.exit();
    });
}

importStudents();
