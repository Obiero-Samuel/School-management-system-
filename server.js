const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, 
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const pendingRegistrations = new Map(); 
const loginCodes = new Map();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@school.com').trim().toLowerCase();
const ADMIN_PASS = (process.env.ADMIN_PASSWORD || 'Admin123!').trim();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.post('/api/register', async (req, res) => {
    const { username, email, password, user_type, staff_role, admission_number } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
        return res.json({ success: false, message: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.' });
    }

    try {
        const [existing] = await pool.execute('SELECT * FROM users WHERE email = ?', [cleanEmail]);
        if (existing.length > 0) return res.json({ success: false, message: 'Email already registered.' });
        const token = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        const verifyLink = `http://${req.headers.host}/verify-email?token=${token}`;
        pendingRegistrations.set(token, { username, email: cleanEmail, password_hash: hashedPassword, user_type, staff_role, admission_number });
        await transporter.sendMail({
            from: `"St. Monica's Portal" <${process.env.SMTP_USER}>`,
            to: cleanEmail,
            subject: 'Activate Your Account',
            html: `<p>Click below to verify your account:</p><a href="${verifyLink}">Verify Email Address</a>`
        });
        res.json({ success: true, message: 'Verification link sent! Check your email.' });
    } catch (err) { res.json({ success: false, message: 'Error sending email.' }); }
});

app.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    const record = pendingRegistrations.get(token);
    if (!record) return res.send("<h1>Link Expired.</h1>");
    try {
        await pool.execute(`INSERT INTO users (username, email, password_hash, user_type, staff_role, admission_number, verified) VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [record.username, record.email, record.password_hash, record.user_type, record.staff_role, record.admission_number]);
        pendingRegistrations.delete(token);
        res.redirect(`/?status=verified&role=${record.user_type}`);
    } catch (err) { res.send("<h1>DB Error.</h1>"); }
});

app.post('/api/login', async (req, res) => {
    const { email, username, admission_number, password, user_type } = req.body;
    const identifier = (email || username || '').trim().toLowerCase();
    if (user_type === 'admin' && identifier === ADMIN_EMAIL && password === ADMIN_PASS) {
        return res.json({ success: true, user: { username: 'Admin', user_type: 'admin' } });
    }
    try {
        let user = null; let roleFound = user_type;
        if (user_type === 'parent') {
            const [rows] = await pool.execute('SELECT * FROM users WHERE (email=? OR username=?) AND admission_number=? AND user_type="parent"', [identifier, identifier, admission_number]);
            user = rows[0];
        } else {
            const [rows] = await pool.execute('SELECT * FROM users WHERE email=? OR username=?', [identifier, identifier]);
            user = rows[0];
            if (!user && user_type === 'staff') {
                const [staffRows] = await pool.execute('SELECT * FROM staff WHERE email=? OR username=?', [identifier, identifier]);
                user = staffRows[0]; if (user) roleFound = 'staff';
            }
        }
        if (!user) return res.json({ success: false, message: 'Account not found.' });
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.json({ success: false, message: 'Incorrect password.' });
        if (user_type === 'parent' || user_type === 'staff') {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            loginCodes.set(user.id, { otp, role: roleFound }); 
            await transporter.sendMail({ from: `"St. Monica's Security" <${process.env.SMTP_USER}>`, to: user.email, subject: 'Login Code', text: `Code: ${otp}` });
            return res.json({ success: true, flow: 'otp_required', userId: user.id, message: 'Code sent to email.' });
        }
        res.json({ success: true, user: { id: user.id, username: user.username, user_type: roleFound } });
    } catch (err) { res.json({ success: false, message: 'Login Error.' }); }
});

app.post('/api/verify-login-otp', (req, res) => {
    const { userId, otp } = req.body;
    const record = loginCodes.get(userId);
    if (record && record.otp === otp) {
        loginCodes.delete(userId);
        return res.json({ success: true, user: { user_type: record.role } }); 
    }
    return res.json({ success: false, message: 'Invalid code.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));