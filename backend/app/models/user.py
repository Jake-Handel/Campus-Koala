from datetime import datetime
from app import db
import bcrypt

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.LargeBinary, nullable=False)  # Changed to store binary hash
    email = db.Column(db.String(120), unique=True, nullable=False)
    study_time = db.Column(db.Integer, default=0)  # Total study time in minutes
    game_time = db.Column(db.Integer, default=0)   # Available game time in minutes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    tasks = db.relationship('Task', backref='user', lazy=True)
    calendar_events = db.relationship('CalendarEvent', backref='user', lazy=True)
    study_sessions = db.relationship('StudySession', backref='user', lazy=True)
    
    @staticmethod
    def generate_password_hash(password):
        if isinstance(password, str):
            password = password.encode('utf-8')
        return bcrypt.hashpw(password, bcrypt.gensalt())

    @staticmethod
    def check_password_hash(password_hash, password):
        if isinstance(password, str):
            password = password.encode('utf-8')
        return bcrypt.checkpw(password, password_hash)

    @classmethod
    def create(cls, username, email, password):
        """Create a new user with hashed password"""
        user = cls(
            username=username,
            email=email,
            password_hash=cls.generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()
        return user
    
    def verify_password(self, password):
        """Verify the user's password"""
        return self.check_password_hash(self.password_hash, password)
    
    def update_password(self, new_password):
        """Update the user's password"""
        self.password_hash = self.generate_password_hash(new_password)
        db.session.commit()
    
    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'study_time': self.study_time,
            'game_time': self.game_time,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'
