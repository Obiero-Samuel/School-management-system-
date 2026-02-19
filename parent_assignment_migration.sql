-- Database Migration for Parent Assignment Review Feature
USE school_management;
-- Assignment Submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submitted_by INT NOT NULL,
    submission_text TEXT,
    file_path VARCHAR(500),
    status ENUM('Draft', 'Submitted', 'Under Review', 'Graded') DEFAULT 'Draft',
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE
);
-- Assignment Reviews table
CREATE TABLE IF NOT EXISTS assignment_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_id INT,
    reviewer_type ENUM('parent', 'teacher') NOT NULL,
    reviewer_id INT NOT NULL,
    review_text TEXT NOT NULL,
    rating ENUM('Easy', 'Medium', 'Hard', 'Very Hard') NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Assignment Grades table
CREATE TABLE IF NOT EXISTS assignment_grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    submission_id INT NOT NULL,
    marks_obtained DECIMAL(5, 2) NOT NULL,
    total_marks DECIMAL(5, 2) NOT NULL,
    teacher_feedback TEXT,
    graded_by INT NOT NULL,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES staff(id) ON DELETE CASCADE,
    UNIQUE KEY unique_grade (submission_id)
);
-- Add subject to assignments
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS subject VARCHAR(100)
AFTER description;
-- Indexes
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_reviews_assignment ON assignment_reviews(assignment_id);