from datetime import datetime
from app import db
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from flask_jwt_extended import get_jwt_identity

class AIConversation(db.Model):
    __tablename__ = 'ai_conversation'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False, default='New Conversation')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = Column(Integer, ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    is_active = Column(Boolean, default=True)
    
    messages = relationship('AIMessage', backref='conversation', lazy=True, cascade='all, delete-orphan')

    def __init__(self, title='New Conversation', user_id=None, is_active=True):
        self.title = title
        # If user_id is not provided, get it from JWT
        if user_id is None:
            try:
                user_id = get_jwt_identity()
                if user_id:
                    user_id = int(user_id)
            except:
                raise ValueError("User ID must be provided")
        self.user_id = user_id
        self.is_active = is_active
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id,
            'is_active': self.is_active
        }

    def to_dict_with_messages(self):
        return {
            'id': self.id,
            'title': self.title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id,
            'is_active': self.is_active,
            'messages': [message.to_dict() for message in self.messages] if self.messages else []
        }

    @classmethod
    def get_conversation(cls, conversation_id: int, user_id: int):
        """Get a conversation by ID for a specific user"""
        return cls.query.filter_by(id=conversation_id, user_id=user_id).first()

    @classmethod
    def get_conversations(cls, user_id: int):
        """Get all conversations for a user, ordered by most recent"""
        return cls.query.filter_by(user_id=user_id).order_by(cls.updated_at.desc()).all()

    @classmethod
    def deactivate_conversation(cls, conversation_id: int):
        """Deactivate a conversation"""
        conversation = cls.query.get(conversation_id)
        if conversation:
            conversation.is_active = False
            db.session.commit()

    @classmethod
    def activate_conversation(cls, conversation_id: int):
        """Activate a conversation"""
        conversation = cls.query.get(conversation_id)
        if conversation:
            conversation.is_active = True
            db.session.commit()

    @classmethod
    def create_conversation(cls, user_id: int, title: str = 'New Conversation'):
        """Create a new conversation"""
        conversation = cls(
            title=title,
            user_id=user_id,
            is_active=True
        )
        db.session.add(conversation)
        db.session.commit()
        return conversation

    def update_title(self, new_title):
        self.title = new_title
        self.updated_at = datetime.utcnow()
        db.session.commit()

class AIMessage(db.Model):
    __tablename__ = 'ai_message'
    
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey('ai_conversation.id'), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __init__(self, conversation_id, role, content):
        self.conversation_id = conversation_id
        self.role = role
        self.content = content
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }