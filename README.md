# School Management System

A comprehensive web-based School Management System built with Flask and MySQL.

## Features

### Admin Module
- **Dashboard**: Overview of school statistics (staff count, student count, classes)
- **Staff Management**: Add and delete staff members (cannot modify profiles)
- **Student Management**: Full CRUD operations (Add, Delete, View, Modify)
- **Stock Management**: View inventory by department (Teaching, Kitchen, Cleaning, Transport, Finance)
- **Reports**: Generate comprehensive staff and student reports
- **Profile Management**: View admin profile information

### Staff/Teacher Module
- **Department-Based Routing**: Automatic redirection based on department (Teaching, Kitchen, Cleaning, Transport, Finance)
- **Profile Management**: View and edit personal profile
- **Teacher-Specific Features**:
  - **Attendance Management**: Record daily student attendance
  - **Assignment Creation**: Create assignments with automatic parent notifications
  - **Marks/Results Management**: Input CAT marks, exam marks, and results
  - **Email Results**: Send results to parents (with fee clearance verification)
  - **Class Management**: View only students in assigned classes

## Prerequisites

- Python 3.8 or higher
- MySQL 8.0 or higher
- pip (Python package manager)

## Installation

### 1. Database Setup

First, create the MySQL database:

```bash
mysql -u root -p
```

Then execute the schema file:

```bash
mysql -u root -p school_management < database/schema.sql
```

Or manually create the database:

```sql
CREATE DATABASE school_management;
```

Then import the schema:

```bash
mysql -u root -p school_management < database/schema.sql
```

### 2. Configure Database Connection

Edit `app.py` and update the database configuration:

```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'your_mysql_username',      # Change this
    'password': 'your_mysql_password',   # Change this
    'database': 'school_management'
}
```

### 3. Configure Email Settings

Update email configuration in `app.py`:

```python
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'      # Change this
app.config['MAIL_PASSWORD'] = 'your-app-password'         # Change this
app.config['MAIL_DEFAULT_SENDER'] = 'your-email@gmail.com'
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated app password in the configuration

### 4. Install Dependencies

```bash
cd school_management_system
pip install -r requirements.txt
```

### 5. Run the Application

```bash
python app.py
```

The application will be available at: `http://localhost:5000`

## Default Login Credentials

### Admin Account
- **Username**: admin
- **Password**: admin123

**IMPORTANT**: After first login, manually add more admin accounts in the database if needed.

## Usage Guide

### For Administrators

1. **Login** with admin credentials
2. **Dashboard**: View school overview and statistics
3. **Staff Management**:
   - Click "Staff" in navigation
   - Add new staff (creates login credentials automatically)
   - Delete staff (cannot modify profiles)
4. **Student Management**:
   - Click "Students" in navigation
   - Add, Edit, View, or Delete students
   - Manage fee status and class assignments
5. **Stock Management**:
   - View inventory grouped by departments
   - See who last updated each item
6. **Reports**:
   - Generate staff or student reports
   - Print or export data

### For Teachers

1. **Login** with credentials provided by admin
2. **Dashboard**: View assigned classes and student count
3. **Attendance**:
   - Select class and date
   - Mark Present, Absent, Late, or Excused
   - Add remarks if needed
4. **Assignments**:
   - Create new assignments
   - Parents automatically notified
   - Set due dates and total marks
5. **Marks/Results**:
   - Input CAT, Mid-Term, End-Term, or Assignment marks
   - Add remarks and grades
   - Send results to parents via email
   - **Note**: Results only sent if student fees are cleared
6. **Profile**:
   - Update contact information
   - Edit qualifications

### For Other Staff (Kitchen, Cleaning, Transport, Finance)

1. **Login** with credentials
2. **Dashboard**: View department-specific information
3. **Profile**: Update personal information

## Database Schema

### Key Tables:
- **users**: Authentication for all user types
- **admins**: Admin profile information
- **staff**: Staff details with department assignments
- **students**: Student information with fee status
- **classes**: Class information with teacher assignments
- **attendance**: Daily attendance records
- **assignments**: Assignment details
- **marks**: Student marks/results
- **fees**: Fee payment tracking
- **stock**: Inventory by department
- **notifications**: Parent notifications for assignments

## Features in Detail

### Fee Clearance System
- Students with unpaid fees have suspended accounts
- Teachers cannot send results to parents if fees are pending
- Fee status: Paid, Pending, Overdue

### Parent Notification System
- Automatic notifications when assignments are created
- Stored in database notifications table
- Can be extended to email notifications

### Email System
- Teachers can email results to parents
- Email logs stored in database
- SMTP configuration required for actual email sending

### Department-Based Access
- Staff automatically routed to department-specific dashboards
- Teachers get full academic management features
- Other departments get basic profile and dashboard access

## Project Structure

```
school_management_system/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── database/
│   └── schema.sql             # Database schema
├── templates/
│   ├── base.html              # Base template
│   ├── index.html             # Landing page
│   ├── login.html             # Login page
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── profile.html
│   │   ├── staff.html
│   │   ├── students.html
│   │   ├── edit_student.html
│   │   ├── stock.html
│   │   ├── reports.html
│   │   └── report_view.html
│   ├── staff/
│   │   ├── dashboard.html
│   │   └── profile.html
│   └── teacher/
│       ├── dashboard.html
│       ├── attendance.html
│       ├── assignments.html
│       └── marks.html
└── static/
    ├── css/
    ├── js/
    └── uploads/
```

## Security Notes

1. **Change default admin password** immediately after first login
2. **Update secret key** in `app.py` before deployment
3. **Use environment variables** for sensitive configuration in production
4. **Enable HTTPS** in production
5. **Regular database backups** recommended

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check database credentials in `app.py`
- Ensure database exists: `SHOW DATABASES;`

### Email Not Sending
- Verify SMTP settings
- For Gmail, use App Password (not regular password)
- Check firewall settings for port 587

### Login Issues
- Verify user exists in database
- Check password hash (use provided hash generator)
- Clear browser cookies

## Future Enhancements (Not Yet Implemented)

- Parent user module
- Advanced reporting with charts
- SMS notifications
- Timetable management
- Library management
- Transport tracking
- Hostel management
- Fee online payment gateway

## Support

For issues or questions, please refer to the code comments or contact the system administrator.

## License

This project is for educational purposes. Modify as needed for your institution.
