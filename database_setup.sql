-- 1. Disable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Clear existing tables
DROP TABLE IF EXISTS parent_students, staff, students, users;

-- 3. Users Table (Updated with ALL required columns)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('admin', 'parent', 'teacher', 'staff', 'student') NOT NULL,
    
    -- Specific columns for roles
    staff_role VARCHAR(50) DEFAULT NULL,       -- For Staff
    admission_number VARCHAR(50) DEFAULT NULL, -- For Parents/Students
    
    verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Staff Table
CREATE TABLE staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, 
    first_name VARCHAR(50),
    middle_name VARCHAR(50),
    last_name VARCHAR(50),
    sex VARCHAR(10),
    department VARCHAR(100),
    staff_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active',
    birth_date DATE,
    join_date DATE,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Students Table
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
);

-- 6. Parent-Student Relationship
CREATE TABLE parent_students (
    parent_id INT,
    student_id VARCHAR(20),
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    PRIMARY KEY (parent_id, student_id)
);

-- 7. Seed Admin
INSERT INTO users (username, email, password_hash, user_type, verified) 
VALUES ('admin', 'admin@school.com', '$2a$12$6K/R1X.2S/f8C.fI6Y6uqupS.q8uUvP6B7S7i8Uu9vUvP6B7S7i8U', 'admin', 1);

-- 8. Re-enable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 1;