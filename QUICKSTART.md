# Quick Start Guide - School Management System

This guide will help you get the system running in 5 minutes!

## Step 1: Install MySQL
Make sure MySQL is installed and running on your system.

## Step 2: Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE school_management;
exit;

# Import the schema
mysql -u root -p school_management < database/schema.sql
```

## Step 3: Configure the Application

Edit `app.py` and update lines 17-22:

```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',           # Your MySQL username
    'password': 'your_password',  # Your MySQL password
    'database': 'school_management'
}
```

## Step 4: Configure Email (Optional - for sending results)

Edit `app.py` lines 27-31:

For Gmail:
1. Enable 2-Factor Authentication in your Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update configuration:

```python
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'
app.config['MAIL_PASSWORD'] = 'your-16-char-app-password'
app.config['MAIL_DEFAULT_SENDER'] = 'your-email@gmail.com'
```

## Step 5: Install Dependencies

```bash
cd school_management_system
pip install -r requirements.txt
```

## Step 6: Run the Application

```bash
python app.py
```

Visit: http://localhost:5000

## Step 7: Login

**Admin Login:**
- Username: `admin`
- Password: `admin123`

## Step 8: Create Sample Data (Optional)

Run the utilities script to create sample classes:

```bash
python utilities.py
```

Choose option 2 to create sample classes.

## Next Steps

1. **Change Admin Password**: After first login, update the admin password in the database
2. **Add Staff**: Go to Staff section and add teachers and other staff
3. **Add Students**: Go to Students section and add students
4. **Assign Classes**: Assign teachers to classes in the database

## Common Issues

### "Can't connect to MySQL"
- Check if MySQL is running: `sudo service mysql status`
- Verify credentials in `app.py`

### "Module not found"
- Run: `pip install -r requirements.txt`

### "Email not sending"
- Emails are optional for now
- To enable: Configure SMTP settings in `app.py`

## What You Can Do Now

### As Admin:
- ✅ Add/Delete Staff
- ✅ Add/Edit/Delete Students
- ✅ View Stock by Department
- ✅ Generate Reports

### As Teacher:
- ✅ Mark Daily Attendance
- ✅ Create Assignments (parents get notified)
- ✅ Input Marks/Results
- ✅ Send Results to Parents (if fees paid)

## Need Help?

Check the full README.md for detailed documentation.

## Quick Tips

1. Use the utilities script (`python utilities.py`) for:
   - Generating password hashes
   - Adding staff interactively
   - Creating sample data

2. Default fee status for new students is "Pending"
   - Update to "Paid" to enable result sending

3. Teachers can only see students in their assigned classes

4. Stock management is view-only for admins (staff update it)

Enjoy your School Management System! 🎓
