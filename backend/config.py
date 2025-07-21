import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///instance/study_app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'dev-key-please-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_SECURE = False  # Set to True in production with HTTPS
    # Disable CSRF for JWT as we're handling it separately
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_CSRF_IN_COOKIES = False
    JWT_CSRF_CHECK_FORM = False
    # Keep these for reference, but they won't be used with CSRF disabled
    JWT_ACCESS_CSRF_HEADER_NAME = 'X-CSRFToken'
    JWT_REFRESH_CSRF_HEADER_NAME = 'X-CSRFToken'
    JWT_IDENTITY_CLAIM = 'sub'
    
    # CORS Configuration
    CORS_ORIGINS = ['http://localhost:3000']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization', 'X-CSRFToken']
    CORS_EXPOSE_HEADERS = ['Content-Range', 'X-Content-Range', 'X-CSRFToken']
    CORS_SUPPORTS_CREDENTIALS = True
    
    # CSRF Settings
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 3600  # 1 hour
    WTF_CSRF_HEADERS = ['X-CSRFToken']
    WTF_CSRF_SSL_STRICT = False  # Set to True in production with HTTPS

class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    DEBUG = False
    
class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
