const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

function formatMySQLDate(dateString) {
    if (!dateString || dateString.trim() === "" || dateString === 'null') return null;
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return null;
}

function safeValue(val) {
    return (val === undefined || val === null || val.toString().trim() === "") ? null : val;
}

async function importStaff() {
    const pool = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const defaultPassword = "Welcome2026";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    console.log('🧹 Wiping staff table...');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('DELETE FROM staff');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

    const results = [];
    fs.createReadStream('staff_import.csv')
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', async () => {
            let imported = 0;
            for (const row of results) {
                try {
                    await pool.execute(
                        `INSERT INTO staff (staff_id, username, password_hash, first_name, middle_name, last_name, sex, department, staff_type, status, birth_date, join_date, email)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            row['staff_id'],
                            row['username'] || row['Username'],
                            hashedPassword,
                            safeValue(row['first_name']),
                            safeValue(row['middle_name']),
                            safeValue(row['surname'] || row['last_name']),
                            safeValue(row['Sex'] || row['sex']),
                            safeValue(row['department']),
                            safeValue(row['staff_type']),
                            safeValue(row['status']) || 'Active',
                            formatMySQLDate(row['birth_date']),
                            formatMySQLDate(row['Join_Date']),
                            safeValue(row['E-mail'] || row['email'])
                        ]
                    );
                    imported++;
                } catch (err) { console.error(`❌ Staff ${row['staff_id']}:`, err.message); }
            }
            console.log(`\n✅ Staff Imported: ${imported} (Password: ${defaultPassword})`);
            process.exit();
        });
}
importStaff();