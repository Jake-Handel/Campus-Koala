import os
from app import create_app, db
from app.models import User, Task, CalendarEvent, StudySession, AIConversation, AIMessage
from sqlalchemy import inspect
from sqlalchemy import Boolean
from sqlalchemy.sql import text

# Get config from environment
config_name = os.getenv('FLASK_CONFIG', 'default')

# Create app instance
app = create_app(config_name)

# Initialize database - this will run only once when the app starts
def init_database():
    with app.app_context():
        try:
            # Create tables if they don't exist
            db.create_all()
            
            # Add is_active column if it doesn't exist
            inspector = inspect(db.engine)
            
            # Check and add study_session columns if needed
            try:
                study_session_columns = [col['name'] for col in inspector.get_columns('study_session')]
                required_columns = ['subject', 'notes', 'duration', 'updated_at']
                
                for column in required_columns:
                    if column not in study_session_columns:
                        # Handle timestamp columns specially
                        if column == 'updated_at':
                            column_def = text("ALTER TABLE study_session ADD COLUMN updated_at DATETIME")
                        else:
                            column_def = text(f"ALTER TABLE study_session ADD COLUMN {column} TEXT")
                        try:
                            with db.engine.connect() as conn:
                                conn.execute(column_def)
                                conn.commit()
                                print(f"Added {column} column to study_session table")
                        except Exception as e:
                            print(f"Error adding {column} column: {str(e)}")
                            conn.rollback()
                            raise
            except Exception as e:
                print(f"Error checking study_session table: {str(e)}")
                raise
            
            # Add is_active column if it doesn't exist
            ai_columns = [col['name'] for col in inspector.get_columns('ai_conversation')]
            
            if 'is_active' not in ai_columns:
                column_def = text("ALTER TABLE ai_conversation ADD COLUMN is_active BOOLEAN DEFAULT TRUE")
                try:
                    with db.engine.connect() as conn:
                        conn.execute(column_def)
                        conn.commit()
                        print("Added is_active column to ai_conversation table")
                except Exception as e:
                    print(f"Error adding is_active column: {str(e)}")
                    conn.rollback()
                    raise
            
            # Remove summary column if it exists
            if 'summary' in ai_columns:
                column_def = text("ALTER TABLE ai_conversation DROP COLUMN summary")
                try:
                    with db.engine.connect() as conn:
                        conn.execute(column_def)
                        conn.commit()
                        print("Removed summary column from ai_conversation table")
                except Exception as e:
                    print(f"Error removing summary column: {str(e)}")
                    conn.rollback()
                    raise
            
            print("Database initialized successfully")
        except Exception as e:
            print(f"Error initializing database: {str(e)}")
            raise

# Initialize database when the app starts
init_database()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
