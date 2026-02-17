# Copilot Coding Agent Instructions for School Management System

## Overview
This is a Flask + MySQL web application for managing school operations. The codebase is organized by user roles (admin, staff/teacher, other staff) and features department-based routing, modular templates, and a notification/email system.

## Architecture & Data Flow
- **app.py**: Main Flask app, all routes and business logic.
- **templates/**: Jinja2 HTML templates, organized by user type (admin, staff, teacher).
- **static/**: CSS, JS, and uploads.
- **database/schema.sql**: MySQL schema for all tables.
- **Department-based routing**: After login, users are redirected to dashboards based on their department/role.
- **Notifications**: Assignment creation triggers parent notifications (DB, can be extended to email).
- **Email**: Results and notifications sent via SMTP (configured in `app.py`).

## Developer Workflows
- **Setup**: Configure DB and email in `app.py` (use env vars in production). Install dependencies with `pip install -r requirements.txt`.
- **Run**: `python app.py` (runs Flask dev server on port 5000).
- **DB**: Use `database/schema.sql` to initialize or reset the database.
- **Testing**: No formal test suite; manual testing via browser and DB.
- **Debugging**: Use print/log statements in `app.py`. Flask debug mode can be enabled for development.

## Project Conventions
- **Sensitive config**: Use environment variables for DB/email/secret key in production. Never commit real secrets.
- **Templates**: All templates extend `base.html` and use `{% block content %}`. Sidebar navigation is role-specific.
- **Forms**: Use Flask-WTF for CSRF protection if possible. All forms should have labels and accessible markup.
- **Database**: All queries use parameterized SQL to prevent injection. User passwords are hashed.
- **Notifications**: Parent notifications are stored in the `notifications` table and can be extended to email/SMS.
- **Department logic**: Staff are routed to dashboards based on their department (see login logic in `app.py`).

## Integration Points
- **Email**: SMTP config in `app.py`. Uses Flask-Mail.
- **Parent notifications**: Triggered on assignment creation, stored in DB, can be extended to email/SMS.
- **Fee clearance**: Teachers cannot send results to parents if fees are pending (enforced in marks/results logic).

## Examples
- To add a new admin route, define it in `app.py` and create a template in `templates/admin/`.
- To add a new notification type, update the notification logic in `app.py` and extend the `notifications` table.
- For department-specific features, use the `department` field in the `staff` table and route accordingly after login.

## References
- See `README.md` for setup, usage, and troubleshooting.
- See `database/schema.sql` for DB structure.
- See `app.py` for all routing and business logic.
- See `templates/` for UI structure and role-based navigation.

---

If you add new modules, update this file with new conventions or workflows. For questions, check code comments or the README.
