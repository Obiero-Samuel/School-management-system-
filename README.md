# School Management System

A comprehensive, modern, and accessible web-based School Management System built with Flask and MySQL.

---

## Summary of Features & Modules

### Admin Panel
- Dashboard with widgets, avatars, and analytics
- Staff management (add, edit, delete, assign tasks, performance/appraisal)
- Student management (full CRUD, fee status, class assignment)
- Stock/inventory management by department
- Reports (custom report builder, export/import CSV)
- Audit logs (track admin actions)
- Permissions/roles management
- Notifications/reminders (send to staff, parents)
- Document management (upload, delete, view)
- Calendar/event management (add, delete, view events)
- Feedback/survey system
- System settings panel (school info, grading, term dates)
- Multi-language admin UI (English, French, Spanish, Swahili)
- Accessibility improvements (ARIA, keyboard navigation)
- Loading spinners, dark mode toggle, responsive UI

### Teacher/Staff Module
- Department-based dashboard routing
- Profile management (view/edit)
- Attendance management (students, teachers)
- Assignment creation (parent notifications)
- Marks/results management (CAT, exams, remarks)
- Email results to parents (fee clearance enforced)
- Class management (view assigned students)
- Task management (view assigned tasks)

### Parent Portal
- Assignment notifications
- View children, results, and notifications

### Other Staff (Kitchen, Cleaning, Transport, Finance)
- Department dashboard
- Profile management

### Analytics & Reporting
- Enrollment, attendance, fee status, staff breakdown
- Custom report builder (filter by date, type)
- Export/import data (CSV)

### Security & Conventions
- Passwords hashed
- All SQL queries parameterized
- Sensitive config via environment variables in production
- Secret key and email/password must be changed before deployment
- HTTPS recommended for production
- Regular database backups

### Integration Points
- Email (SMTP, Flask-Mail)
- Parent notifications (DB, extendable to email/SMS)
- Fee clearance logic
- Department-based routing

### Accessibility & UI
- ARIA roles, keyboard navigation
- Responsive design (Bootstrap 5)
- Dark mode toggle
- Loading spinners
- Multi-language support

---

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
│   ├── admin/                 # Admin templates
│   ├── staff/                 # Staff templates
│   ├── teacher/               # Teacher templates
│   ├── parent/                # Parent templates
│   └── ...                    # Other modules
└── static/
    ├── style.css              # Custom styles
    ├── uploads/               # File uploads
```

---

## Setup & Usage

1. **Configure MySQL database** using `database/schema.sql`
2. **Update DB and email config** in `app.py`
3. **Install dependencies**: `pip install -r requirements.txt`
4. **Run the app**: `python app.py`
5. **Access via browser**: `http://localhost:5000`

---

## Key Conventions
- All templates extend `base.html` and use `{% block content %}`
- Sidebar navigation is role-specific
- All forms have labels and accessible markup
- All queries use parameterized SQL
- Passwords are hashed
- Notifications stored in DB, extendable to email/SMS
- Department logic: staff routed by department after login

---

## Security Notes
- Change default admin password and secret key before deployment
- Use environment variables for sensitive config
- Enable HTTPS in production
- Regular database backups recommended

---

## Troubleshooting
- See code comments and README for setup, usage, and troubleshooting
- For database or email errors, check config and credentials
- For login issues, verify user exists and password hash

---

## License
This project is for educational purposes. Modify as needed for your institution.

---

## For full details, see:
- `app.py` for all routing and business logic
- `database/schema.sql` for DB structure
- `templates/` for UI structure and role-based navigation
- `.github/copilot-instructions.md` for coding conventions

---

**All features, modules, and improvements requested have been implemented and pushed to the repository.**
