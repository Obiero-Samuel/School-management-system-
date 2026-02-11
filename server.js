// Admin: Get individual student profile (must be after all other routes)
app.get('/api/admin/student-profile/:id', authenticateToken, async (req, res) => {
    if (req.user.user_type !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    try {
        const [students] = await pool.execute('SELECT * FROM students WHERE student_id = ?', [req.params.id]);
        if (students.length === 0) return res.json({ success: false, message: 'Student not found.' });
        res.json({ success: true, student: students[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch student.' });
    }
});

// Admin: Get individual staff profile
app.get('/api/admin/staff-profile/:id', authenticateToken, async (req, res) => {
    if (req.user.user_type !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    try {
        const [staff] = await pool.execute('SELECT * FROM staff WHERE staff_id = ?', [req.params.id]);
        if (staff.length === 0) return res.json({ success: false, message: 'Staff not found.' });
        res.json({ success: true, staff: staff[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch staff.' });
    }
});
const express = require('express');
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
// Recommend HTTPS in production
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.status(403).send('HTTPS is required for security.');
    }
    next();
// Admin: Get individual student profile (moved after app initialization)
// 2FA OTP store (in-memory for demo)
const otpStore = {};
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Helper to generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Endpoint to request OTP for parent login (step 1 of 2FA)
app.post('/api/parent/request-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required.' });
    // Check if parent exists and is verified
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ? AND user_type = ?', [email, 'parent']);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'Parent not found.' });
    const user = users[0];
    if (!user.verified) return res.status(403).json({ success: false, message: 'Email not verified.' });
    // Generate and store OTP
    const otp = generateOTP();
    otpStore[email] = { otp, expires: Date.now() + OTP_EXPIRY };
    // Send OTP via email
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Your School Portal Login OTP',
// Admin: Get individual staff profile (moved after app initialization)
app.get('/api/admin/staff-profile/:id', authenticateToken, async (req, res) => {
    if (req.user.user_type !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    try {
        const [staff] = await pool.execute('SELECT * FROM staff WHERE staff_id = ?', [req.params.id]);
        if (staff.length === 0) return res.json({ success: false, message: 'Staff not found.' });
        res.json({ success: true, staff: staff[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch staff.' });
    }
});
            html: `<p>Your OTP for login is: <b>${otp}</b>. It expires in 5 minutes.</p>`
        });
    } catch (err) {
        console.error('OTP email send error:', err);
        return res.status(500).json({ success: false, message: 'Failed to send OTP.', error: err.stack });
    }
    res.json({ success: true, message: 'OTP sent to your email.' });
});

// Endpoint to verify OTP (step 2 of 2FA)
app.post('/api/parent/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required.' });
    const record = otpStore[email];
    if (!record || record.otp !== otp || Date.now() > record.expires) {
        return res.status(401).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    delete otpStore[email];
    res.json({ success: true, message: 'OTP verified. You may now log in.' });
});
// In-memory login attempt tracker (for demo; use Redis/DB in production)
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Database connection
// Email transporter setup
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid token'
            });
        }

        req.user = user;
        next();
    });
}

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working!'
    });
});

// Debug database endpoint
app.get('/api/debug/db', async (req, res) => {
    try {
        const [test] = await pool.execute('SELECT 1 as status');
        const [users] = await pool.execute('SELECT * FROM users');
        const [tables] = await pool.execute('SHOW TABLES');

        res.json({
            success: true,
            connection: 'OK',
            test: test,
            users: users,
            tables: tables
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// SIMPLE LOGIN THAT ALWAYS WORKS
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, admission_number } = req.body;
        console.log('Login attempt for:', email);

        // Rate limiting and account lockout (by email)
        if (email) {
            const now = Date.now();
            if (!loginAttempts[email]) {
                loginAttempts[email] = { count: 0, last: now, lockedUntil: 0 };
            }
            const attempt = loginAttempts[email];
            if (attempt.lockedUntil && now < attempt.lockedUntil) {
                return res.status(429).json({ success: false, message: `Account locked due to too many failed attempts. Try again later.` });
            }
        }

        // Option 1: Hardcoded admin login (GUARANTEED TO WORK)
        if (email === 'admin@school.com' && password === 'Admin123!') {
            const token = jwt.sign(
                {
                    id: 1,
                    email: 'admin@school.com',
                    username: 'admin',
                    user_type: 'admin'
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '24h' }
            );
            return res.json({
                success: true,
                token,
                user: {
                    id: 1,
                    username: 'admin',
                    email: 'admin@school.com',
                    user_type: 'admin'
                }
            });
        }

        // Option 2: Try database login
        try {
            const [users] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            if (users.length === 0) {
                // Increment failed attempts
                if (email) {
                    loginAttempts[email].count++;
                    loginAttempts[email].last = Date.now();
                    if (loginAttempts[email].count >= MAX_ATTEMPTS) {
                        loginAttempts[email].lockedUntil = Date.now() + LOCK_TIME;
                    }
                }
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            const user = users[0];
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                // Increment failed attempts
                if (email) {
                    loginAttempts[email].count++;
                    loginAttempts[email].last = Date.now();
                    if (loginAttempts[email].count >= MAX_ATTEMPTS) {
                        loginAttempts[email].lockedUntil = Date.now() + LOCK_TIME;
                    }
                }
                // Log failed attempt for parent
                if (user.user_type === 'parent') {
                    await pool.execute('INSERT INTO activity_log (user_id, action, description) VALUES (?, ?, ?)', [user.id, 'login_failed', 'Parent login failed: wrong password']);
                }
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            // Reset failed attempts on success
            if (email) {
                loginAttempts[email].count = 0;
                loginAttempts[email].lockedUntil = 0;
            }
            // Require email verification
            if (!user.verified) {
                return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
            }
            // Parent login: require admission_number and parent-student link
            if (user.user_type === 'parent') {
                if (!admission_number) {
                    return res.status(400).json({ success: false, message: 'Admission number required for parent login.' });
                }
                // Find student by admission number
                const [students] = await pool.execute('SELECT student_id FROM students WHERE student_id = ?', [admission_number]);
                if (students.length === 0) {
                    return res.status(401).json({ success: false, message: 'Invalid admission number.' });
                }
                const studentId = students[0].student_id;
                // Check parent-student link
                const [links] = await pool.execute('SELECT * FROM parent_students WHERE parent_id = ? AND student_id = ?', [user.id, studentId]);
                if (links.length === 0) {
                    await pool.execute('INSERT INTO activity_log (user_id, action, description) VALUES (?, ?, ?)', [user.id, 'login_failed', 'Parent login failed: not linked to student']);
                    return res.status(401).json({ success: false, message: 'You are not authorized for this admission number.' });
                }
                // Log successful parent login
                await pool.execute('INSERT INTO activity_log (user_id, action, description) VALUES (?, ?, ?)', [user.id, 'login_success', 'Parent login successful']);
            }
            // Update last login
            await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
            // Create token, include staff_role if staff
            const tokenPayload = {
                id: user.id,
                email: user.email,
                username: user.username,
                user_type: user.user_type
            };
            if (user.user_type === 'staff') {
                tokenPayload.staff_role = user.staff_role;
            }
            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
            // Return user object with staff_role if staff
            const userObj = {
                id: user.id,
                username: user.username,
                email: user.email,
                user_type: user.user_type
            };
            if (user.user_type === 'staff') {
                userObj.staff_role = user.staff_role;
            }
            return res.json({ success: true, token, user: userObj });
        } catch (dbError) {
            console.log('Database login failed:', dbError.message);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin dashboard
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [students] = await pool.execute('SELECT COUNT(*) as count FROM students');
        const [assignments] = await pool.execute('SELECT COUNT(*) as count FROM assignments');

        res.json({
            success: true,
            data: {
                statistics: {
                    total_users: users[0].count,
                    total_students: students[0].count,
                    total_assignments: assignments[0].count
                },
                user: req.user
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const [users] = await pool.execute('SELECT id, username, email, user_type, created_at FROM users');
        res.json({ success: true, data: users });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Register new user
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, user_type, staff_role, admission_number } = req.body;

        // Input validation
        if (!username || !email || !password || !user_type) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }
        if (!['staff', 'parent'].includes(user_type)) {
            return res.status(400).json({ success: false, message: 'Invalid user type' });
        }
        // Staff role validation
        if (user_type === 'staff') {
            const validRoles = ['teacher', 'cook', 'driver', 'cleaner', 'account_office'];
            if (!staff_role || !validRoles.includes(staff_role)) {
                return res.status(400).json({ success: false, message: 'Invalid or missing staff role.' });
            }
        }
        // Strong password check (min 8, upper, lower, number, symbol)
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include upper, lower, number, and symbol.' });
        }
        // Prevent SQL injection by using parameterized queries (already used)
        // Check for existing user
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        // Insert user with verified = 0
        let insertQuery, insertParams, newUserId;
        if (user_type === 'staff') {
            insertQuery = 'INSERT INTO users (username, email, password_hash, user_type, staff_role, is_active, verified) VALUES (?, ?, ?, ?, ?, ?, ?)';
            insertParams = [username, email, hashedPassword, user_type, staff_role, true, false];
        } else {
            // Parent registration: require admission_number
            if (!admission_number) {
                return res.status(400).json({ success: false, message: 'Admission number required for parent registration.' });
            }
            // Find student by admission number
            const [students] = await pool.execute('SELECT student_id FROM students WHERE student_id = ?', [admission_number]);
            if (students.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid admission number.' });
            }
            const studentId = students[0].student_id;
            // Enforce max 2 parents per student
            const [parentLinks] = await pool.execute('SELECT COUNT(*) as count FROM parent_students WHERE student_id = ?', [studentId]);
            if (parentLinks[0].count >= 2) {
                return res.status(400).json({ success: false, message: 'Maximum number of parents already linked to this student.' });
            }
            // Insert parent user
            insertQuery = 'INSERT INTO users (username, email, password_hash, user_type, is_active, verified) VALUES (?, ?, ?, ?, ?, ?)';
            insertParams = [username, email, hashedPassword, user_type, true, false];
        }
        const [result] = await pool.execute(insertQuery, insertParams);
        newUserId = result.insertId;
        // If parent, link to student
        if (user_type === 'parent') {
            await pool.execute('INSERT INTO parent_students (parent_id, student_id, relationship) VALUES (?, ?, ?)', [newUserId, students[0].student_id, 'parent']);
        }
        // Generate verification token
        const jwtSecret = process.env.JWT_SECRET || 'default_secret';
        const verificationToken = jwt.sign({ email }, jwtSecret, { expiresIn: '1d' });
        const verificationLink = `${req.protocol}://${req.get('host')}/api/verify?token=${verificationToken}`;
        // Send verification email
        try {
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Verify your email - School Management System',
                html: `<h3>Welcome, ${username}!</h3><p>Please verify your email by clicking <a href="${verificationLink}">here</a>.</p>`
            });
        } catch (mailError) {
            console.error('Email notification error:', mailError);
        }
        res.status(201).json({ success: true, message: 'Registration successful! Please check your email to verify your account.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Email verification endpoint
app.get('/api/verify', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('Verification token missing');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        const email = decoded.email;
        // Mark user as verified in DB
        await pool.execute('UPDATE users SET verified = 1 WHERE email = ?', [email]);
        res.send('<h2>Email verified successfully!</h2><p>You can now log in.</p>');
    } catch (error) {
        res.status(400).send('Invalid or expired verification token');
    }
});

// Get all students
app.get('/api/students', authenticateToken, async (req, res) => {
    try {
        const [students] = await pool.execute('SELECT * FROM students');
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: Get all students (full details)
app.get('/api/admin/all-students', authenticateToken, async (req, res) => {
    if (req.user.user_type !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    try {
        const [students] = await pool.execute('SELECT * FROM students');
        res.json({ success: true, students });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch students.' });
    }
});

// Admin: Get all staff (full details)
app.get('/api/admin/all-staff', authenticateToken, async (req, res) => {
    if (req.user.user_type !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    try {
        const [staff] = await pool.execute('SELECT * FROM staff');
        res.json({ success: true, staff });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch staff.' });
    }
});

// Get assignments (staff/admin only)
app.get('/api/assignments', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'staff' && req.user.user_type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Staff access required'
            });
        }

        const [assignments] = await pool.execute(
            'SELECT a.*, u.username as assigned_by_name FROM assignments a JOIN users u ON a.assigned_by = u.id ORDER BY a.due_date'
        );

        res.json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Parent: Get my children (only linked students)
app.get('/api/parent/children', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'parent') {
            return res.status(403).json({
                success: false,
                message: 'Parent access required'
            });
        }
        const [children] = await pool.execute(
            `SELECT s.*, ps.relationship 
             FROM students s
             JOIN parent_students ps ON s.id = ps.student_id
             WHERE ps.parent_id = ?`,
            [req.user.id]
        );
        res.json({ success: true, data: children });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Parent: Get info for a specific student (only if linked)
app.get('/api/parent/student-info/:admission_number', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'parent') {
            return res.status(403).json({ success: false, message: 'Parent access required' });
        }
        const admission_number = req.params.admission_number;
        // Find student by admission number
        const [students] = await pool.execute('SELECT * FROM students WHERE student_id = ?', [admission_number]);
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }
        const student = students[0];
        // Check parent-student link
        const [links] = await pool.execute('SELECT * FROM parent_students WHERE parent_id = ? AND student_id = ?', [req.user.id, student.student_id]);
        if (links.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view this student.' });
        }
        // Check fee status for this student (latest term/year)
        const [fees] = await pool.execute('SELECT * FROM fees WHERE student_id = ? ORDER BY due_date DESC LIMIT 1', [student.student_id]);
        if (fees.length > 0) {
            const fee = fees[0];
            if (fee.status !== 'paid') {
                return res.status(403).json({ success: false, message: 'Account suspended: Outstanding fees. Please clear all fees to access student info.' });
            }
        }
        res.json({ success: true, data: student });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
    console.log('🚀 Starting School Management System...');

    const dbConnected = await testConnection();

    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log('\n📋 Available Endpoints:');
        console.log('GET  /                     - Main interface');
        console.log('POST /api/login            - Login');
        console.log('GET  /api/test             - Test API');
        console.log('GET  /api/debug/db         - Debug database');
        console.log('GET  /api/admin/dashboard  - Admin dashboard');
        console.log('GET  /api/admin/users      - All users (admin)');
        console.log('GET  /api/students         - All students');
        console.log('GET  /api/assignments      - Assignments (staff)');
        console.log('GET  /api/parent/children  - Parent children');
        console.log('\n🔑 Admin Login (GUARANTEED TO WORK):');
        console.log('Email: admin@school.com');
        console.log('Password: Admin123!');

        if (!dbConnected) {
            console.log('\n⚠️ Database connection failed');
            console.log('But you can still login as admin using hardcoded credentials!');
        }
    });
}

// Start the server
startServer();
