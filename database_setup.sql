-- Clear existing tables (if any)
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS assignment_submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS academic_records;
DROP TABLE IF EXISTS parent_students;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;
-- 1. Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('admin', 'staff', 'parent') NOT NULL,
    staff_role ENUM(
        'teacher',
        'cook',
        'driver',
        'cleaner',
        'account_office'
    ) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL
);
-- 2. Students Table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. Parent-Student Relationship
CREATE TABLE parent_students (
    parent_id INT,
    student_id INT,
    relationship VARCHAR(20),
    PRIMARY KEY (parent_id, student_id),
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
-- 4. Academic Records
CREATE TABLE academic_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(5),
    percentage DECIMAL(5, 2),
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    teacher_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
-- 5. Assignments Table
CREATE TABLE assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATETIME NOT NULL,
    assigned_by INT NOT NULL,
    subject VARCHAR(100),
    max_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);
-- 6. Activity Log
CREATE TABLE activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE
    SET NULL
);
-- 7. Insert Default Admin User
-- Password will be hashed by the application
INSERT INTO users (username, email, password_hash, user_type)
VALUES (
        'admin',
        'admin@school.com',
        '$2a$10$N9qo8uLOickgx2ZMRZoMye.MOWw.Qxdd.6W6Z1M4gqX7II5eF8L3O',
        'admin'
    );
-- 8. Insert Sample Data for Testing
INSERT INTO students (
        student_id,
        first_name,
        last_name,
        grade_level,
        date_of_birth
    )
VALUES (
        'STU001',
        'John',
        'Doe',
        'Grade 10',
        '2008-05-15'
    ),
    (
        'STU002',
        'Jane',
        'Smith',
        'Grade 9',
        '2009-08-20'
    );
-- 9. Sample academic records
INSERT INTO academic_records (
        student_id,
        subject,
        grade,
        percentage,
        semester,
        academic_year
    )
VALUES (
        1,
        'Mathematics',
        'A',
        92.5,
        'First',
        '2024-2025'
    ),
    (1, 'Science', 'B+', 85.0, 'First', '2024-2025'),
    (2, 'English', 'A-', 89.5, 'First', '2024-2025'),
    (
        2,
        'Mathematics',
        'B',
        82.0,
        'First',
        '2024-2025'
    );
SELECT '✅ Database setup complete!' as message;