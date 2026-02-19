

# ------------------- TEACHER ENHANCEMENT ROUTES -------------------
# (All teacher routes moved here, after app and decorators)

# ------------------- PARENT ROUTES -------------------
from flask import send_file  # For file downloads

# (All parent routes moved here, after app and decorators)
# Parent required decorator
def parent_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'parent':
            flash('Parent access required.', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
from functools import wraps
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key_here_change_in_production'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Email Configuration (Configure these later)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'  # Change this
app.config['MAIL_PASSWORD'] = 'your-app-password'      # Change this
app.config['MAIL_DEFAULT_SENDER'] = 'your-email@gmail.com'

mail = Mail(app)

# Database Configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',           # Change this
    'password': '1234',           # Change this
    'database': 'school_management'
}

# Database connection function
def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Admin required decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'admin':
            flash('Admin access required.', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Staff required decorator
def staff_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'staff':
            flash('Staff access required.', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Teacher required decorator
def teacher_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('user_type') != 'staff' or session.get('department') != 'Teaching':
            flash('Teacher access required.', 'danger')
            return redirect(url_for('staff_dashboard'))
        return f(*args, **kwargs)
    return decorated_function

# Home/Landing page
@app.route('/')
def index():
    return render_template('index.html')

# Login page
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor(dictionary=True)
            # Check user in users table
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            if user and check_password_hash(user['password'], password):
                session.clear()
                session['user_id'] = user['id']
                session['user_type'] = user['user_type']
                # Admin
                if user['user_type'] == 'admin':
                    cursor.execute("SELECT first_name, last_name FROM admins WHERE user_id = %s", (user['id'],))
                    admin = cursor.fetchone()
                    session['full_name'] = f"{admin['first_name']} {admin['last_name']}" if admin else username
                    cursor.close()
                    conn.close()
                    return redirect(url_for('admin_dashboard'))
                # Staff (including teachers)
                elif user['user_type'] == 'staff':
                    cursor.execute("SELECT * FROM staff WHERE user_id = %s", (user['id'],))
                    staff = cursor.fetchone()
                    if staff:
                        session['staff_id'] = staff['id']
                        session['department'] = None
                        # Get department name
                        cursor.execute("SELECT name FROM departments WHERE id = %s", (staff['department_id'],))
                        dept = cursor.fetchone()
                        if dept:
                            session['department'] = dept['name']
                        session['full_name'] = f"{staff['first_name']} {staff['last_name']}"
                        cursor.close()
                        conn.close()
                        # Route to department dashboard
                        if session['department'] == 'Teaching':
                            return redirect(url_for('teacher_dashboard'))
                        else:
                            return redirect(url_for('staff_dashboard'))
                    else:
                        flash('Staff profile not found.', 'danger')
                # Parent
                elif user['user_type'] == 'parent':
                    cursor.execute("SELECT first_name, last_name FROM parents WHERE user_id = %s", (user['id'],))
                    parent = cursor.fetchone()
                    session['full_name'] = f"{parent['first_name']} {parent['last_name']}" if parent else username
                    cursor.close()
                    conn.close()
                    return redirect(url_for('index'))  # Or parent dashboard if exists
                else:
                    flash('Unknown user type.', 'danger')
            else:
                flash('Invalid username or password.', 'danger')
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()
        else:
            flash('Database connection error.', 'danger')
        return render_template('login.html')
    return render_template('login.html')

# View Staff Details
@app.route('/admin/staff/view/<int:staff_id>')
@admin_required
def view_staff(staff_id):
    conn = get_db_connection()
    print("[DEBUG] Entered teacher_dashboard route")
    import sys
    sys.stdout.flush()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.*, d.name as department_name, u.username, u.email 
            FROM staff s 
            JOIN departments d ON s.department_id = d.id 
            JOIN users u ON s.user_id = u.id
            WHERE s.id = %s
        """, (staff_id,))
        staff = cursor.fetchone()
        cursor.close()
        conn.close()
        if staff:
            return render_template('admin/view_staff.html', staff=staff)
        else:
            flash('Staff member not found.', 'warning')
            return redirect(url_for('admin_staff'))
    flash('Database connection error.', 'danger')
    return redirect(url_for('admin_staff'))

# Edit Staff Details
@app.route('/admin/staff/edit/<int:staff_id>', methods=['GET', 'POST'])
@admin_required
def edit_staff(staff_id):
    conn = get_db_connection()
    if conn:
        if request.method == 'POST':
            try:
                cursor = conn.cursor()
                # Update staff table
                cursor.execute("""
                    UPDATE staff 
                    SET staff_number = %s, first_name = %s, last_name = %s, 
                        department_id = %s, phone = %s, address = %s, 
                        date_of_birth = %s, hire_date = %s, qualification = %s
                    WHERE id = %s
                """, (
                    request.form.get('staff_number'),
                    request.form.get('first_name'),
                    request.form.get('last_name'),
                    request.form.get('department_id'),
                    request.form.get('phone'),
                    request.form.get('address'),
                    request.form.get('date_of_birth'),
                    request.form.get('hire_date'),
                    request.form.get('qualification'),
                    staff_id
                ))
                # Update email in users table
                cursor.execute("""
                    UPDATE users 
                    SET email = %s 
                    WHERE id = (SELECT user_id FROM staff WHERE id = %s)
                """, (request.form.get('email'), staff_id))

                # Update password if provided
                new_password = request.form.get('password')
                if new_password:
                    from werkzeug.security import generate_password_hash
                    hashed_pw = generate_password_hash(new_password)
                    cursor.execute("""
                        UPDATE users
                        SET password = %s
                        WHERE id = (SELECT user_id FROM staff WHERE id = %s)
                    """, (hashed_pw, staff_id))

                conn.commit()
                flash('Staff member updated successfully!', 'success')
                cursor.close()
                conn.close()
                return redirect(url_for('admin_staff'))
            except Error as e:
                conn.rollback()
                flash(f'Error updating staff: {str(e)}', 'danger')
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.*, d.name as department_name, u.username, u.email 
            FROM staff s 
            JOIN departments d ON s.department_id = d.id 
            JOIN users u ON s.user_id = u.id
            WHERE s.id = %s
        """, (staff_id,))
        staff = cursor.fetchone()
        cursor.execute("SELECT * FROM departments")
        departments = cursor.fetchall()
        cursor.close()
        conn.close()
        return render_template('admin/edit_staff.html', staff=staff, departments=departments)
    return redirect(url_for('admin_staff'))

@app.route('/admin/staff/add', methods=['POST'])
@admin_required
def add_staff():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            
            # Create user account
            username = request.form.get('username')
            password = generate_password_hash(request.form.get('password'))
            email = request.form.get('email')
            
            cursor.execute("""
                INSERT INTO users (username, password, email, user_type) 
                VALUES (%s, %s, %s, 'staff')
            """, (username, password, email))
            user_id = cursor.lastrowid
            
            # Create staff profile
            cursor.execute("""
                INSERT INTO staff (user_id, staff_number, first_name, last_name, 
                                 department_id, phone, address, date_of_birth, 
                                 hire_date, qualification) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                request.form.get('staff_number'),
                request.form.get('first_name'),
                request.form.get('last_name'),
                request.form.get('department_id'),
                request.form.get('phone'),
                request.form.get('address'),
                request.form.get('date_of_birth'),
                request.form.get('hire_date'),
                request.form.get('qualification')
            ))
            
            conn.commit()
            flash('Staff member added successfully!', 'success')
        except Error as e:
            conn.rollback()
            flash(f'Error adding staff: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    
    return redirect(url_for('admin_staff'))

@app.route('/admin/staff/delete/<int:staff_id>')
@admin_required
def delete_staff(staff_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT user_id FROM staff WHERE id = %s", (staff_id,))
            result = cursor.fetchone()
            if result:
                user_id = result[0]
                cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
                conn.commit()
                flash('Staff member deleted successfully!', 'success')
        except Error as e:
            conn.rollback()
            flash(f'Error deleting staff: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    
    return redirect(url_for('admin_staff'))

# Student Management
@app.route('/admin/students')
@admin_required
def admin_students():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.*, c.name as class_name 
            FROM students s 
            LEFT JOIN classes c ON s.class_id = c.id
            ORDER BY s.student_id DESC
        """)
        students = cursor.fetchall()
        
        cursor.execute("SELECT * FROM classes")
        classes = cursor.fetchall()
        
        cursor.close()
        conn.close()
        return render_template('admin/students.html', students=students, classes=classes)
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/students/add', methods=['POST'])
@admin_required
def add_student():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO students (admission_number, first_name, last_name, 
                                    class_id, date_of_birth, gender, address, 
                                    phone, enrollment_date, fee_status) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                request.form.get('admission_number'),
                request.form.get('first_name'),
                request.form.get('last_name'),
                request.form.get('class_id'),
                request.form.get('date_of_birth'),
                request.form.get('gender'),
                request.form.get('address'),
                request.form.get('phone'),
                request.form.get('enrollment_date'),
                request.form.get('fee_status', 'Pending')
            ))
            conn.commit()
            flash('Student added successfully!', 'success')
        except Error as e:
            conn.rollback()
            flash(f'Error adding student: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    
    return redirect(url_for('admin_students'))

@app.route('/admin/students/edit/<int:student_id>', methods=['GET', 'POST'])
@admin_required
def edit_student(student_id):
    conn = get_db_connection()
    if conn:
        if request.method == 'POST':
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE students 
                    SET first_name = %s, last_name = %s, class_id = %s, 
                        date_of_birth = %s, gender = %s, address = %s, 
                        phone = %s, fee_status = %s 
                    WHERE id = %s
                """, (
                    request.form.get('first_name'),
                    request.form.get('last_name'),
                    request.form.get('class_id'),
                    request.form.get('date_of_birth'),
                    request.form.get('gender'),
                    request.form.get('address'),
                    request.form.get('phone'),
                    request.form.get('fee_status'),
                    student_id
                ))
                conn.commit()
                flash('Student updated successfully!', 'success')
                cursor.close()
                conn.close()
                return redirect(url_for('admin_students'))
            except Error as e:
                conn.rollback()
                flash(f'Error updating student: {str(e)}', 'danger')
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM students WHERE student_id = %s", (student_id,))
        student = cursor.fetchone()
        
        cursor.execute("SELECT * FROM classes")
        classes = cursor.fetchall()
        
        cursor.close()
        conn.close()
        return render_template('admin/edit_student.html', student=student, classes=classes)
    
    return redirect(url_for('admin_students'))

@app.route('/admin/students/delete/<int:student_id>')
@admin_required
def delete_student(student_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
            conn.commit()
            flash('Student deleted successfully!', 'success')
        except Error as e:
            conn.rollback()
            flash(f'Error deleting student: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    
    return redirect(url_for('admin_students'))

# Stock Management
@app.route('/admin/stock')
@admin_required
def admin_stock():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT st.*, d.name as department_name, 
                   CONCAT(s.first_name, ' ', s.last_name) as updated_by_name
            FROM stock st
            JOIN departments d ON st.department_id = d.id
            LEFT JOIN staff s ON st.last_updated_by = s.id
            ORDER BY st.last_updated_date DESC
        """)
        stock_items = cursor.fetchall()
        
        cursor.execute("SELECT * FROM departments")
        departments = cursor.fetchall()
        
        cursor.close()
        conn.close()
        return render_template('admin/stock.html', stock_items=stock_items, departments=departments)
    return redirect(url_for('admin_dashboard'))

# Reports
@app.route('/admin/reports')
@admin_required
def admin_reports():
    return render_template('admin/reports.html')

@app.route('/admin/reports/generate', methods=['POST'])
@admin_required
def generate_report():
    report_type = request.form.get('report_type')
    conn = get_db_connection()
    
    if conn:
        cursor = conn.cursor(dictionary=True)
        data = []
        
        if report_type == 'staff':
            cursor.execute("""
                SELECT s.staff_number, s.first_name, s.last_name, 
                       d.name as department, s.hire_date, s.phone, s.email
                FROM staff s
                JOIN departments d ON s.department_id = d.id
                JOIN users u ON s.user_id = u.id
                ORDER BY s.id
            """)
            data = cursor.fetchall()
        
        elif report_type == 'students':
            cursor.execute("""
                SELECT s.admission_number, s.first_name, s.last_name, 
                       c.name as class, s.fee_status, s.enrollment_date
                FROM students s
                LEFT JOIN classes c ON s.class_id = c.id
                ORDER BY s.id
            """)
            data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template('admin/report_view.html', 
                             report_type=report_type, 
                             data=data)
    
    return redirect(url_for('admin_reports'))

# ========== TEACHER ATTENDANCE (ADMIN) ==========
@app.route('/admin/teacher-attendance', methods=['GET', 'POST'])
@admin_required
def admin_teacher_attendance():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        # Get all teachers
        cursor.execute("SELECT s.id, s.first_name, s.last_name, d.name as department FROM staff s JOIN departments d ON s.department_id = d.id WHERE d.name = 'Teaching'")
        teachers = cursor.fetchall()
        message = None
        if request.method == 'POST':
            attendance_date = request.form.get('attendance_date')
            for teacher in teachers:
                status = request.form.get(f'status_{teacher["id"]}')
                remarks = request.form.get(f'remarks_{teacher["id"]}', '')
                # Check if already recorded
                cursor.execute("SELECT id FROM teacher_attendance WHERE staff_id = %s AND attendance_date = %s", (teacher['id'], attendance_date))
                if cursor.fetchone():
                    cursor.execute("UPDATE teacher_attendance SET status = %s, remarks = %s, recorded_by = %s WHERE staff_id = %s AND attendance_date = %s", (status, remarks, session['user_id'], teacher['id'], attendance_date))
                else:
                    cursor.execute("INSERT INTO teacher_attendance (staff_id, attendance_date, status, remarks, recorded_by) VALUES (%s, %s, %s, %s, %s)", (teacher['id'], attendance_date, status, remarks, session['user_id']))
            conn.commit()
            message = 'Attendance recorded!'
        cursor.close()
        conn.close()
        return render_template('admin/teacher_attendance.html', teachers=teachers, message=message)
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/teacher-attendance/history')
@admin_required
def admin_teacher_attendance_history():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT ta.*, s.first_name, s.last_name, d.name as department
            FROM teacher_attendance ta
            JOIN staff s ON ta.staff_id = s.id
            JOIN departments d ON s.department_id = d.id
            ORDER BY ta.attendance_date DESC, s.last_name
        """)
        records = cursor.fetchall()
        cursor.close()
        conn.close()
        return render_template('admin/teacher_attendance_history.html', records=records)
    return redirect(url_for('admin_dashboard'))

# ===================== STAFF ROUTES =====================

@app.route('/staff/dashboard')
@staff_required
def staff_dashboard():
    department = session.get('department')
    current_datetime = datetime.now().strftime("%A, %B %d, %Y %I:%M %p")
    
    # Route to specific department dashboard
    if department == 'Teaching':
        return redirect(url_for('teacher_dashboard'))
    
    # For other departments, show basic dashboard
    return render_template('staff/dashboard.html', 
                         department=department,
                         current_datetime=current_datetime)

@app.route('/staff/profile', methods=['GET', 'POST'])
@staff_required
def staff_profile():
    conn = get_db_connection()
    if conn:
        if request.method == 'POST':
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE staff 
                    SET first_name = %s, last_name = %s, date_of_birth = %s, phone = %s, address = %s, qualification = %s
                    WHERE id = %s
                """, (
                    request.form.get('first_name'),
                    request.form.get('last_name'),
                    request.form.get('date_of_birth'),
                    request.form.get('phone'),
                    request.form.get('address'),
                    request.form.get('qualification'),
                    session['staff_id']
                ))
                
                # Update email in users table
                cursor.execute("""
                    UPDATE users 
                    SET email = %s 
                    WHERE id = %s
                """, (request.form.get('email'), session['user_id']))
                
                conn.commit()
                flash('Profile updated successfully!', 'success')
            except Error as e:
                conn.rollback()
                flash(f'Error updating profile: {str(e)}', 'danger')
            finally:
                cursor.close()
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.*, d.name as department_name, u.username, u.email 
            FROM staff s 
            JOIN departments d ON s.department_id = d.id 
            JOIN users u ON s.user_id = u.id
            WHERE s.id = %s
        """, (session['staff_id'],))
        profile = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return render_template('staff/profile.html', profile=profile)
    
    return redirect(url_for('staff_dashboard'))

# ===================== TEACHER ROUTES =====================

@app.route('/teacher/dashboard')
@teacher_required
def teacher_dashboard():
    conn = get_db_connection()
    current_datetime = datetime.now().strftime("%A, %B %d, %Y %I:%M %p")
    
    if conn:
        cursor = conn.cursor(dictionary=True)
        # Debug: Print current database and table structure (always, before any queries)
        import sys
        try:
            cursor.execute("SELECT DATABASE()")
            db_name = cursor.fetchone()
            print("[DEBUG] Connected database:", db_name)
            sys.stdout.flush()
            cursor.execute("SHOW CREATE TABLE classes")
            table_struct = cursor.fetchone()
            print("[DEBUG] Table structure:", table_struct)
            sys.stdout.flush()
        except Exception as e:
            print("[DEBUG] Error fetching DB/table info:", e)
            sys.stdout.flush()
        # Get teacher's classes
        cursor.execute("""
            SELECT * FROM classes WHERE teacher_id = %s
        """, (session['staff_id'],))
        my_classes = cursor.fetchall()
        
        # Get total students in teacher's classes
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM students s 
            JOIN classes c ON s.class_id = c.id 
            WHERE c.teacher_id = %s
        """, (session['staff_id'],))
        student_count = cursor.fetchone()['count']
        
        # Get pending assignments count
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM assignments 
            WHERE teacher_id = %s AND due_date >= CURDATE()
        """, (session['staff_id'],))
        assignment_count = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        
        return render_template('teacher/dashboard.html',
                             current_datetime=current_datetime,
                             my_classes=my_classes,
                             student_count=student_count,
                             assignment_count=assignment_count)
    
    return render_template('teacher/dashboard.html', current_datetime=current_datetime)

@app.route('/teacher/attendance', methods=['GET', 'POST'])
@teacher_required
def teacher_attendance():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        
        # Get teacher's classes
        cursor.execute("SELECT * FROM classes WHERE teacher_id = %s", (session['staff_id'],))
        my_classes = cursor.fetchall()
        
        if request.method == 'POST':
            class_id = request.form.get('class_id')
            attendance_date = request.form.get('date')
            
            # Get students in the class
            cursor.execute("""
                SELECT id, first_name, last_name FROM students WHERE class_id = %s
            """, (class_id,))
            students = cursor.fetchall()
            
            try:
                for student in students:
                    status = request.form.get(f'status_{student["id"]}')
                    remarks = request.form.get(f'remarks_{student["id"]}', '')
                    
                    # Check if attendance already exists
                    cursor.execute("""
                        SELECT id FROM attendance 
                        WHERE student_id = %s AND date = %s
                    """, (student['id'], attendance_date))
                    
                    if cursor.fetchone():
                        # Update existing
                        cursor.execute("""
                            UPDATE attendance 
                            SET status = %s, remarks = %s 
                            WHERE student_id = %s AND date = %s
                        """, (status, remarks, student['id'], attendance_date))
                    else:
                        # Insert new
                        cursor.execute("""
                            INSERT INTO attendance 
                            (student_id, class_id, date, status, remarks, recorded_by) 
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, (student['id'], class_id, attendance_date, status, remarks, session['staff_id']))
                
                conn.commit()
                flash('Attendance recorded successfully!', 'success')
            except Error as e:
                conn.rollback()
                flash(f'Error recording attendance: {str(e)}', 'danger')
        
        cursor.close()
        conn.close()
        return render_template('teacher/attendance.html', my_classes=my_classes)
    
    return redirect(url_for('teacher_dashboard'))

@app.route('/teacher/get-students/<int:class_id>')
@teacher_required
def get_class_students(class_id):
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, admission_number, first_name, last_name 
            FROM students WHERE class_id = %s
        """, (class_id,))
        students = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(students)
    return jsonify([])

@app.route('/teacher/assignments', methods=['GET', 'POST'])
@teacher_required
def teacher_assignments():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        
        if request.method == 'POST':
            try:
                class_id = request.form.get('class_id')
                
                cursor.execute("""
                    INSERT INTO assignments 
                    (class_id, teacher_id, title, description, due_date, total_marks) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    class_id,
                    session['staff_id'],
                    request.form.get('title'),
                    request.form.get('description'),
                    request.form.get('due_date'),
                    request.form.get('total_marks', 100)
                ))
                assignment_id = cursor.lastrowid
                
                # Notify parents of students in this class
                cursor.execute("""
                    SELECT DISTINCT p.user_id, s.first_name, s.last_name
                    FROM students s
                    JOIN student_parents sp ON s.id = sp.student_id
                    JOIN parents p ON sp.parent_id = p.id
                    WHERE s.class_id = %s
                """, (class_id,))
                parents = cursor.fetchall()
                
                assignment_title = request.form.get('title')
                for parent in parents:
                    cursor.execute("""
                        INSERT INTO notifications 
                        (user_id, type, title, message) 
                        VALUES (%s, 'assignment', %s, %s)
                    """, (
                        parent['user_id'],
                        'New Assignment',
                        f"New assignment '{assignment_title}' has been given to {parent['first_name']} {parent['last_name']}"
                    ))
                
                conn.commit()
                flash('Assignment created and parents notified!', 'success')
            except Error as e:
                conn.rollback()
                flash(f'Error creating assignment: {str(e)}', 'danger')
        
        # Get teacher's classes
        cursor.execute("SELECT * FROM classes WHERE teacher_id = %s", (session['staff_id'],))
        my_classes = cursor.fetchall()
        
        # Get assignments
        cursor.execute("""
            SELECT a.*, c.name as class_name 
            FROM assignments a 
            JOIN classes c ON a.class_id = c.id 
            WHERE a.teacher_id = %s 
            ORDER BY a.created_at DESC
        """, (session['staff_id'],))
        assignments = cursor.fetchall()
        
        cursor.close()
        conn.close()
        return render_template('teacher/assignments.html', 
                             my_classes=my_classes, 
                             assignments=assignments)
    
    return redirect(url_for('teacher_dashboard'))

@app.route('/teacher/marks', methods=['GET', 'POST'])
@teacher_required
def teacher_marks():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        
        if request.method == 'POST':
            try:
                student_id = request.form.get('student_id')
                class_id = request.form.get('class_id')
                
                cursor.execute("""
                    INSERT INTO marks 
                    (student_id, class_id, subject, exam_type, marks_obtained, 
                     total_marks, term, academic_year, teacher_id, remarks) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    student_id,
                    class_id,
                    request.form.get('subject'),
                    request.form.get('exam_type'),
                    request.form.get('marks_obtained'),
                    request.form.get('total_marks'),
                    request.form.get('term'),
                    request.form.get('academic_year'),
                    session['staff_id'],
                    request.form.get('remarks', '')
                ))
                conn.commit()
                flash('Marks recorded successfully!', 'success')
            except Error as e:
                conn.rollback()
                flash(f'Error recording marks: {str(e)}', 'danger')
        
        # Get teacher's classes
        cursor.execute("SELECT * FROM classes WHERE teacher_id = %s", (session['staff_id'],))
        my_classes = cursor.fetchall()
        
        # Get recent marks entries
        cursor.execute("""
            SELECT m.*, s.first_name, s.surname AS last_name, s.admission_number, c.name as class_name
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            JOIN classes c ON m.class_id = c.id
            WHERE m.teacher_id = %s
            ORDER BY m.created_at DESC
            LIMIT 50
        """, (session['staff_id'],))
        marks_records = cursor.fetchall()
        
        cursor.close()
        conn.close()
        return render_template('teacher/marks.html', 
                             my_classes=my_classes, 
                             marks_records=marks_records)
    
    return redirect(url_for('teacher_dashboard'))

@app.route('/teacher/send-results', methods=['POST'])
@teacher_required
def send_results():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            student_id = request.form.get('student_id')
            
            # Check fee status
            cursor.execute("""
                SELECT fee_status, account_suspended, first_name, last_name 
                FROM students WHERE id = %s
            """, (student_id,))
            student = cursor.fetchone()
            
            if student['fee_status'] != 'Paid' or student['account_suspended']:
                flash('Cannot send results. Student account is suspended or fees not cleared.', 'warning')
                cursor.close()
                conn.close()
                return redirect(url_for('teacher_marks'))
            
            # Get parent emails
            cursor.execute("""
                SELECT u.email, p.first_name, p.last_name
                FROM student_parents sp
                JOIN parents p ON sp.parent_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE sp.student_id = %s AND sp.is_primary_contact = TRUE
            """, (student_id,))
            parents = cursor.fetchall()
            
            # Get student marks
            cursor.execute("""
                SELECT * FROM marks 
                WHERE student_id = %s 
                ORDER BY created_at DESC
            """, (student_id,))
            marks = cursor.fetchall()
            
            # Send email to each parent
            for parent in parents:
                try:
                    msg = Message(
                        subject=f"Academic Results for {student['first_name']} {student['last_name']}",
                        recipients=[parent['email']]
                    )
                    
                    # Create email body
                    body = f"""
                    Dear {parent['first_name']} {parent['last_name']},
                    
                    Please find below the academic results for {student['first_name']} {student['last_name']}:
                    
                    """
                    
                    for mark in marks:
                        body += f"\n{mark['subject']} - {mark['exam_type']}: {mark['marks_obtained']}/{mark['total_marks']}"
                        if mark['remarks']:
                            body += f" - {mark['remarks']}"
                    
                    body += "\n\nBest regards,\n" + session['full_name']
                    
                    msg.body = body
                    mail.send(msg)
                    
                    # Log email
                    cursor.execute("""
                        INSERT INTO email_logs 
                        (sender_id, recipient_email, subject, body, status) 
                        VALUES (%s, %s, %s, %s, 'Sent')
                    """, (session['user_id'], parent['email'], msg.subject, body))
                    
                except Exception as e:
                    print(f"Error sending email: {e}")
                    cursor.execute("""
                        INSERT INTO email_logs 
                        (sender_id, recipient_email, subject, body, status) 
                        VALUES (%s, %s, %s, %s, 'Failed')
                    """, (session['user_id'], parent['email'], f"Results for {student['first_name']}", str(e)))
            
            conn.commit()
            flash('Results sent to parents successfully!', 'success')
        except Error as e:
            conn.rollback()
            flash(f'Error sending results: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    
    return redirect(url_for('teacher_marks'))

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    # Enable Flask debug mode for detailed error pages
    app.run(debug=True, host='0.0.0.0', port=5000)
