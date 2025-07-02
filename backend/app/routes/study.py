from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.study_session import StudySession
from app import db
import traceback

bp = Blueprint('study', __name__, url_prefix='/api/study')

def get_current_user():
    """Helper function to get and validate current user"""
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return None
    return user_id

@bp.errorhandler(Exception)
def handle_error(e):
    current_app.logger.error(f"Error in study routes: {str(e)}")
    current_app.logger.error(traceback.format_exc())
    return jsonify({"error": "An unexpected error occurred"}), 500

@bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_study_sessions():
    try:
        user_id = get_current_user()
        if not user_id:
            return jsonify({"error": "Invalid user"}), 401

        sessions = StudySession.query.filter_by(user_id=user_id).order_by(StudySession.start_time.desc()).all()
        return jsonify([session.to_dict() for session in sessions])
    except Exception as e:
        return handle_error(e)

@bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_study_session():
    try:
        user_id = get_current_user()
        if not user_id:
            return jsonify({"error": "Invalid user"}), 401

        data = request.get_json()
        if not data or 'subject' not in data:
            return jsonify({"error": "Subject is required"}), 400

        session = StudySession(
            user_id=user_id,
            subject=data.get('subject'),
            notes=data.get('notes'),
            start_time=datetime.utcnow()
        )
        db.session.add(session)
        db.session.commit()
        return jsonify(session.to_dict()), 201
    except Exception as e:
        return handle_error(e)

@bp.route('/sessions/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_study_session(session_id):
    try:
        user_id = get_current_user()
        if not user_id:
            return jsonify({"error": "Invalid user"}), 401

        session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return jsonify({"error": "Study session not found"}), 404

        data = request.get_json()
        if 'end_time' in data:
            # Make sure both times are timezone-aware
            end_time = datetime.fromisoformat(data['end_time'])
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)
            
            session.end_time = end_time
            
            if session.start_time and session.end_time:
                # Ensure start_time is timezone-aware
                start_time = session.start_time
                if start_time.tzinfo is None:
                    start_time = start_time.replace(tzinfo=timezone.utc)
                
                # Calculate duration in minutes
                duration_minutes = max(0, int((end_time - start_time).total_seconds() // 60))
                session.duration = duration_minutes
        if 'notes' in data:
            session.notes = data['notes']

        db.session.commit()
        return jsonify(session.to_dict())
    except Exception as e:
        return handle_error(e)

@bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_study_session(session_id):
    try:
        user_id = get_current_user()
        if not user_id:
            return jsonify({"error": "Invalid user"}), 401

        session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return jsonify({"error": "Study session not found"}), 404

        db.session.delete(session)
        db.session.commit()
        return '', 204
    except Exception as e:
        return handle_error(e)
