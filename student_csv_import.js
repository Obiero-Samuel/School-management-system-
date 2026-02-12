const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

function formatMySQLDate(dateString) {
    if (!dateString || dateString.trim() === "" || dateString === 'null') return null;
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return null;
}

function sanitizeNum(val) {
    if (!val) return 0;
    return parseFloat(val.toString().replace(/[^\d.-]/g, '')) || 0;
}

async function importStudents() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true // Enable this to run multiple queries if needed
  });

  console.log('🧹 Re-creating students table schema...');
  
  // 1. Disable FK checks to allow dropping the table safely
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

  // 2. Drop the old table completely to remove bad schema
  await pool.execute('DROP TABLE IF EXISTS students');

  // 3. Create the table fresh with ALL correct columns
  const createTableQuery = `
    CREATE TABLE students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        middle_name VARCHAR(50),
        last_name VARCHAR(50) NOT NULL,
        admission_date DATE,
        sex VARCHAR(10),
        status VARCHAR(20) DEFAULT 'Active',
        sponsor_type VARCHAR(50),
        religion VARCHAR(50),
        nationality VARCHAR(50),
        grade_level VARCHAR(100),
        grand_fee_charged DECIMAL(15, 2) DEFAULT 0.00,
        grand_fee_adjusted DECIMAL(15, 2) DEFAULT 0.00,
        grand_fee_paid DECIMAL(15, 2) DEFAULT 0.00,
        grand_balance DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.execute(createTableQuery);

  // 4. Re-enable FK checks
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ Schema refreshed. Starting import...');

  const results = [];
  fs.createReadStream('List of Active Students.csv')
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      let imported = 0;
      for (const row of results) {
        try {
          await pool.execute(
            `INSERT INTO students (
                student_id, first_name, middle_name, last_name, admission_date, 
                sex, status, sponsor_type, religion, nationality, grade_level, 
                grand_fee_charged, grand_fee_adjusted, grand_fee_paid, grand_balance
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                row['student_id'], 
                row['first_name'], 
                row['middle_name'] || null, 
                row['surname'] || row['last_name'],
                formatMySQLDate(row['admission_date']),
                row['sex'], 
                row['status'] || 'Active', 
                row['sponsor_type'], 
                row['religion'], 
                row['nationality'],
                row['recent_stream'],
                sanitizeNum(row['grand_fee_charged']), 
                sanitizeNum(row['grand_fee_adjusted']),
                sanitizeNum(row['grand_fee_paid']), 
                sanitizeNum(row['grand_balance'])
            ]
          );
          imported++;
        } catch (err) { 
            console.error(`❌ Student ${row['student_id']}:`, err.message); 
        }
      }
      console.log(`\n✅ Student Import Complete. Imported: ${imported}`);
      process.exit();
    });
}
importStudents();