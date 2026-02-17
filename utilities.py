#!/usr/bin/env python3
"""
Utility script for School Management System
Provides helpful functions for setup and management
"""

from werkzeug.security import generate_password_hash
import mysql.connector
from datetime import datetime

def generate_password():
    """Generate a password hash for manual database entry"""
    print("\n=== Password Hash Generator ===")
    password = input("Enter password to hash: ")
    hashed = generate_password_hash(password)
    print(f"\nPassword Hash:\n{hashed}")
    print("\nCopy this hash and use it in your SQL INSERT statement.")
    return hashed

def create_sample_data():
    """Create sample classes and data for testing"""
    print("\n=== Create Sample Data ===")
    host = input("MySQL Host (default: localhost): ") or "localhost"
    user = input("MySQL User (default: root): ") or "root"
    password = input("MySQL Password: ")
    database = input("Database Name (default: school_management): ") or "school_management"
    
    try:
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        
        # Create sample classes
        classes_data = [
            ('Grade 1A', 'Grade 1', 30),
            ('Grade 2A', 'Grade 2', 30),
            ('Grade 3A', 'Grade 3', 30),
            ('Grade 4A', 'Grade 4', 30),
            ('Grade 5A', 'Grade 5', 30),
        ]
        
        print("\nCreating sample classes...")
        for class_name, grade, capacity in classes_data:
            cursor.execute("""
                INSERT INTO classes (name, grade_level, capacity) 
                VALUES (%s, %s, %s)
            """, (class_name, grade, capacity))
        
        conn.commit()
        print("✓ Sample classes created successfully!")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"Error: {e}")

def add_staff_member():
    """Interactive prompt to add a staff member"""
    print("\n=== Add Staff Member ===")
    host = input("MySQL Host (default: localhost): ") or "localhost"
    user = input("MySQL User (default: root): ") or "root"
    password = input("MySQL Password: ")
    database = input("Database Name (default: school_management): ") or "school_management"
    
    try:
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        
        # Get staff details
        print("\nEnter staff details:")
        username = input("Username: ")
        pwd = input("Password: ")
        email = input("Email: ")
        first_name = input("First Name: ")
        last_name = input("Last Name: ")
        staff_number = input("Staff Number: ")
        
        # Show departments
        cursor.execute("SELECT id, name FROM departments")
        departments = cursor.fetchall()
        print("\nAvailable Departments:")
        for dept_id, dept_name in departments:
            print(f"{dept_id}. {dept_name}")
        dept_id = int(input("Department ID: "))
        
        phone = input("Phone (optional): ") or None
        address = input("Address (optional): ") or None
        hire_date = input("Hire Date (YYYY-MM-DD, default today): ") or datetime.now().strftime('%Y-%m-%d')
        
        # Create user account
        pwd_hash = generate_password_hash(pwd)
        cursor.execute("""
            INSERT INTO users (username, password, email, user_type) 
            VALUES (%s, %s, %s, 'staff')
        """, (username, pwd_hash, email))
        user_id = cursor.lastrowid
        
        # Create staff profile
        cursor.execute("""
            INSERT INTO staff (user_id, staff_number, first_name, last_name, 
                             department_id, phone, address, hire_date) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, staff_number, first_name, last_name, dept_id, phone, address, hire_date))
        
        conn.commit()
        print(f"\n✓ Staff member '{username}' added successfully!")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"Error: {e}")

def main_menu():
    """Main menu for utilities"""
    while True:
        print("\n" + "="*50)
        print("School Management System - Utilities")
        print("="*50)
        print("1. Generate Password Hash")
        print("2. Create Sample Classes")
        print("3. Add Staff Member (Interactive)")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ")
        
        if choice == '1':
            generate_password()
        elif choice == '2':
            create_sample_data()
        elif choice == '3':
            add_staff_member()
        elif choice == '4':
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == '__main__':
    main_menu()
