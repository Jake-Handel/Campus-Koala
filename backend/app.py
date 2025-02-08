import os
from app import create_app, db

# Get config from environment
config_name = os.getenv('FLASK_CONFIG', 'default')

# Create app instance
app = create_app(config_name)

if __name__ == '__main__':
    with app.app_context():
        # Drop all tables and recreate them
        db.drop_all()
        db.create_all()
    app.run(debug=True, port=5000)
