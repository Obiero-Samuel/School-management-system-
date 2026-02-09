const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Database connection
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
        const { email, password } = req.body;

        console.log('Login attempt for:', email);

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
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const user = users[0];
            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Update last login
            await pool.execute(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id]
            );

            // Create token
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    user_type: user.user_type
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    user_type: user.user_type
                }
            });

        } catch (dbError) {
            console.log('Database login failed:', dbError.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
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
        const { username, email, password, user_type } = req.body;

        // Input validation
        if (!username || !email || !password || !user_type) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }
        if (!['staff', 'parent'].includes(user_type)) {
            return res.status(400).json({ success: false, message: 'Invalid user type' });
        }
        // Strong password check
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include upper, lower, and number.' });
        }
        // Prevent SQL injection by using parameterized queries (already used)
        // Check for existing user
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        await pool.execute(
            'INSERT INTO users (username, email, password_hash, user_type) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, user_type]
        );
        // TODO: Add encryption for sensitive data, monitoring, and backups
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
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

// Parent: Get my children
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
