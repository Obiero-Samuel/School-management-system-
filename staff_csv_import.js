const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function importStaff() {
    const pool = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    const results = [];
    fs.createReadStream('staff_import.csv')
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', async () => {
            for (const staff of results) {
                // Map and sanitize values, use null for missing
                const values = [
                    staff['staff_id'] || null,
                    staff['username'] || staff['Username'] || null,
                    staff['first_name'] || staff['First Name'] || null,
                    staff['middle_name'] || staff['Middle Name'] || null,
                    staff['surname'] || staff['Surname'] || null,
                    staff['Sex'] || staff['sex'] || null,
                    staff['department'] || staff['Department'] || null,
                    staff['staff_type'] || staff['Staff Type'] || null,
                    staff['status'] || staff['Status'] || null,
                    staff['birth_date'] || staff['Birth Date'] || null,
                    staff['Join_Date'] || staff['Join Date'] || null,
                    staff['E-mail'] || staff['email'] || null
                ];
                // Skip if staff_id or username is missing
                if (!values[0] || !values[1]) {
                    console.error('Skipping row: missing staff_id or Username', staff);
                    continue;
                }
                try {
                    await pool.execute(
                        `INSERT INTO staff (staff_id, username, first_name, middle_name, surname, sex, department, staff_type, status, birth_date, join_date, email)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        values
                    );
                } catch (err) {
                    console.error('Error inserting staff:', values[0], err.message);
                }
            }
            console.log('Staff import complete.');
            process.exit();
        });
}

importStaff();
