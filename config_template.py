# Configuration File
# Copy this to config.py and update with your settings

import os

class Config:
    # Secret Key - Change this to a random string
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here-change-in-production'
    
    # Database Configuration
    DB_HOST = 'localhost'
    DB_USER = 'root'
    DB_PASSWORD = ''  # Your MySQL password
    DB_NAME = 'school_management'
    
    # Email Configuration
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'your-email@gmail.com'
    MAIL_PASSWORD = 'your-app-password'
    MAIL_DEFAULT_SENDER = 'your-email@gmail.com'
    
    # Upload Configuration
    UPLOAD_FOLDER = 'static/uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Application Settings
    DEBUG = True  # Set to False in production
    HOST = '0.0.0.0'
    PORT = 5000
