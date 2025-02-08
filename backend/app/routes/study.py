from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models import StudySession, User
from app.utils import calculate_game_time
from app import db

bp = Blueprint('study', __name__, url_prefix='/api/study')

@bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    user_id = get_jwt_identity()
    sessions = StudySession.query.filter_by(user_id=user_id).all()
    return jsonify([session.to_dict() for session in sessions]), 200

@bp.route('/start', methods=['POST'])
@jwt_required()
def start_session():
    user_id = get_jwt_identity()
    
    # Check if there's already an active session
    active_session = StudySession.query.filter_by(
        user_id=user_id,
        end_time=None
    ).first()
    
    if active_session:
        return jsonify({"error": "Active study session already exists"}), 400
    
    # Create new session
    new_session = StudySession(
        user_id=user_id,
        start_time=datetime.utcnow()
    )
    
    db.session.add(new_session)
    db.session.commit()
    
    return jsonify(new_session.to_dict()), 201

@bp.route('/end', methods=['POST'])
@jwt_required()
def end_session():
    user_id = get_jwt_identity()
    
    # Find active session
    active_session = StudySession.query.filter_by(
        user_id=user_id,
        end_time=None
    ).first()
    
    if not active_session:
        return jsonify({"error": "No active study session found"}), 404
    
    # End session and calculate duration
    end_time = datetime.utcnow()
    duration = int((end_time - active_session.start_time).total_seconds() / 60)
    game_time_earned = calculate_game_time(duration)
    
    # Update session
    active_session.end_time = end_time
    active_session.duration = duration
    active_session.game_time_earned = game_time_earned
    
    # Update user's total study time and game time
    user = User.query.get(user_id)
    user.study_time += duration
    user.game_time += game_time_earned
    
    db.session.commit()
    
    return jsonify({
        "session": active_session.to_dict(),
        "total_study_time": user.study_time,
        "total_game_time": user.game_time
    }), 200

@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Get all completed sessions
    completed_sessions = StudySession.query.filter(
        StudySession.user_id == user_id,
        StudySession.end_time.isnot(None)
    ).all()
    
    total_sessions = len(completed_sessions)
    total_duration = sum(session.duration for session in completed_sessions)
    total_game_time = sum(session.game_time_earned for session in completed_sessions)
    
    return jsonify({
        "total_sessions": total_sessions,
        "total_study_time": user.study_time,
        "total_game_time": user.game_time,
        "available_game_time": user.game_time,
        "total_duration": total_duration,
        "sessions": [session.to_dict() for session in completed_sessions]
    }), 200
