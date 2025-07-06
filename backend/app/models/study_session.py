from datetime import datetime, timezone
from app import db
from app.models.user import User
from sqlalchemy import event

class StudySession(db.Model):
    __tablename__ = 'study_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=False, default='Study Session')
    start_time = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    end_time = db.Column(db.DateTime)
    duration = db.Column(db.Integer, default=0)  # Duration in seconds
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), 
                          onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = db.relationship('User', back_populates='study_sessions')
    
    def __init__(self, **kwargs):
        super(StudySession, self).__init__(**kwargs)
        if self.start_time and not self.end_time:
            self.duration = 0  # Initialize duration for active sessions

    def __repr__(self):
        return f'<StudySession {self.id} - {self.subject} ({self.duration}s)>'

    def to_dict(self):
        """Convert model to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subject': self.subject,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.duration,
            'duration_minutes': self.duration // 60 if self.duration else 0,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed': self.end_time is not None
        }
    
    def update_duration(self):
        """Update duration based on start and end times."""
        if self.start_time and self.end_time:
            # Ensure both times are timezone-aware
            start = self.start_time.replace(tzinfo=timezone.utc) if self.start_time.tzinfo is None else self.start_time
            end = self.end_time.replace(tzinfo=timezone.utc) if self.end_time.tzinfo is None else self.end_time
            
            # Calculate duration in seconds
            self.duration = max(0, int((end - start).total_seconds()))
            return self.duration
        return 0

# Update duration before flush
@event.listens_for(StudySession, 'before_update')
def update_duration_before_update(mapper, connection, target):
    if target.end_time and target.start_time:
        target.update_duration()

# Update duration on session end
@event.listens_for(StudySession.end_time, 'set')
def update_duration_on_end_time_set(target, value, oldvalue, initiator):
    if value is not None and target.start_time is not None:
        target.update_duration()
