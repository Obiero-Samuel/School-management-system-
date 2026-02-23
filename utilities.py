#!/usr/bin/env python3
"""


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
