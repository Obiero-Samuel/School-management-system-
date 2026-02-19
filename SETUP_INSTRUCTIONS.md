# Parent Assignment Review Feature Setup Instructions

This guide will help you set up, migrate, and test the Parent Assignment Review feature in your Flask School Management System.

---

## 1. Prerequisites
- Python 3.8+
- MySQL server (configured and running)
- pip (Python package manager)
- (Optional) Virtual environment tool (venv, virtualenv, etc.)

---

## 2. Installation

1. **Clone or update your repository**
   ```sh
   git clone <your-repo-url>
   cd school-management-system
   ```

2. **Install dependencies**
   ```sh
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   - Copy `config_template.py` to `config.py` and update with your DB and email credentials.
   - (Recommended) Use a `.env` file for sensitive config in production.

---

## 3. Database Migration

1. **Initialize or update your database**
   - Ensure your MySQL server is running and the `school_management` database exists.
   - Run the migration script to add new tables:
     ```sh
     mysql -u <user> -p school_management < parent_assignment_migration.sql
     ```
   - (If setting up from scratch, also run `schema.sql` first.)

---

## 4. File Uploads
- Ensure the `static/uploads/assignments/` directory exists and is writable by the Flask app.

---

## 5. Running the App

1. **Start the Flask development server**
   ```sh
   python app.py
   ```
   - The app runs on [http://localhost:5000](http://localhost:5000) by default.
   - Enable debug mode in `app.py` for development.

---

## 6. Manual Testing

- **Login as Parent:**
  - View dashboard, children, assignments, assignment details, submit assignments, add reviews, and view notifications.
- **Login as Teacher:**
  - View assignment submissions, grade, add reviews, and download files.
- **Login as Admin/Staff:**
  - Confirm new features do not break existing admin/staff flows.

---

## 7. Troubleshooting
- Check the terminal for Flask errors.
- Ensure MySQL credentials and DB are correct.
- Ensure all required directories exist and are writable.
- For email/notification issues, check SMTP config in `app.py`.

---

## 8. References
- See `README.md` for general project setup.
- See `parent_assignment_migration.sql` for new DB tables.
- See `app.py` for all routes and logic.
- See `templates/parent/` and `templates/teacher/` for new UI.

---

## 9. Support
For further help, contact the project maintainer or open an issue on GitHub.
