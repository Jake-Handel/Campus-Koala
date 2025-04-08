import os
from app import create_app, db

# Get config from environment
config_name = os.getenv('FLASK_CONFIG', 'default')

# Create app instance
app = create_app(config_name)

if __name__ == '__main__':
    with app.app_context():
        # Create tables if they don't exist
        try:
            db.create_all()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Error creating database tables: {e}")
    app.run(debug=True, port=5000)
