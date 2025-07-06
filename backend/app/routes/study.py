from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
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
    """Get all study sessions for the current user with optional filtering."""
    try:
        user_id = get_current_user()
        if not user_id:
            return jsonify({"error": "Invalid user"}), 401

        # Get query parameters
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', 0, type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        completed = request.args.get('completed', type=lambda x: x.lower() == 'true')
        subject = request.args.get('subject')

        # Build query
        query = StudySession.query.filter_by(user_id=user_id)
        
        # Apply filters
        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date)
                query = query.filter(StudySession.start_time >= start_date)
            except ValueError:
                return jsonify({"error": "Invalid start_date format. Use ISO 8601 format"}), 400
        
        if end_date:
            try:
                end_date = datetime.fromisoformat(end_date)
                query = query.filter(StudySession.start_time <= end_date)
            except ValueError:
                return jsonify({"error": "Invalid end_date format. Use ISO 8601 format"}), 400
        
        if completed is not None:
            if completed:
                query = query.filter(StudySession.end_time.isnot(None))
            else:
                query = query.filter(StudySession.end_time.is_(None))
                
        if subject:
            query = query.filter(StudySession.subject.ilike(f'%{subject}%'))

        # Get total count before pagination
        total = query.count()
        
        # Apply ordering and pagination
        query = query.order_by(StudySession.start_time.desc())
        
        if limit:
            query = query.limit(limit).offset(offset)

        sessions = query.all()
        
        return jsonify({
            'total': total,
            'limit': limit,
            'offset': offset,
            'sessions': [session.to_dict() for session in sessions]
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching study sessions: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return handle_error(e)

@bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_study_session():
    """Create a new study session."""
    try:
        user_id = get_current_user()
        if not user_id:
            return jsonify({"error": "Invalid user"}), 401

        data = request.get_json() or {}
        
        # Validate required fields
        if not data.get('subject'):
            return jsonify({"error": "Subject is required"}), 400

        # Parse dates if provided
        start_time = None
        if 'start_time' in data:
            try:
                start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
                if start_time.tzinfo is not None:
                    start_time = start_time.replace(tzinfo=None)
            except (ValueError, TypeError) as e:
                return jsonify({"error": "Invalid start_time format. Use ISO 8601 format"}), 400

        # Create new session
        session = StudySession(
            user_id=user_id,
            subject=data['subject'],
            start_time=start_time or datetime.now(timezone.utc),
            notes=data.get('notes')
        )
        
        # If end_time is provided, set it and update duration
        if 'end_time' in data:
            try:
                end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
                if end_time.tzinfo is None:
                    end_time = end_time.replace(tzinfo=timezone.utc)
                session.end_time = end_time
                # Explicitly set duration to ensure it's updated
                session.duration = session.update_duration()

            except (ValueError, TypeError) as e:
                current_app.logger.error(f"Error parsing end_time: {str(e)}")
                return jsonify({"error": "Invalid end_time format. Use ISO 8601 format"}), 400

        db.session.add(session)
        db.session.commit()
        
        return jsonify(session.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating study session: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return handle_error(e)

@bp.route('/sessions/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_study_session(session_id):
    """Update an existing study session."""
    try:
        user_id = get_current_user()
        if not user_id:
            return jsonify({"error": "Invalid user"}), 401

        session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return jsonify({"error": "Study session not found"}), 404

        data = request.get_json() or {}
        
        # Update fields if provided
        if 'subject' in data:
            session.subject = data['subject']
        if 'notes' in data:
            session.notes = data['notes']
            
        # Handle start_time update
        if 'start_time' in data:
            try:
                start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
                if start_time.tzinfo is None:
                    start_time = start_time.replace(tzinfo=timezone.utc)
                session.start_time = start_time
                # If we have an end_time, update the duration
                if session.end_time:
                    session.duration = session.update_duration()
            except (ValueError, TypeError) as e:
                current_app.logger.error(f"Error parsing start_time: {str(e)}")
                return jsonify({"error": "Invalid start_time format. Use ISO 8601 format"}), 400
                
        # Handle end_time update
        if 'end_time' in data:
            try:
                end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
                if end_time.tzinfo is None:
                    end_time = end_time.replace(tzinfo=timezone.utc)
                session.end_time = end_time
                # Explicitly set duration to ensure it's updated
                session.duration = session.update_duration()

            except (ValueError, TypeError) as e:
                current_app.logger.error(f"Error parsing end_time: {str(e)}")
                return jsonify({"error": "Invalid end_time format. Use ISO 8601 format"}), 400
        
        # Handle end_time update
        if 'end_time' in data:
            try:
                if data['end_time'] is None:
                    session.end_time = None
                    session.duration = 0
                else:
                    end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
                    if end_time.tzinfo is not None:
                        end_time = end_time.replace(tzinfo=None)
                    session.end_time = end_time
                    session.update_duration()
                    
            except (ValueError, TypeError) as e:
                return jsonify({"error": "Invalid end_time format. Use ISO 8601 format"}), 400
        
        # Handle direct duration update (for manual corrections)
        if 'duration' in data and data['duration'] is not None:
            try:
                session.duration = max(0, int(data['duration']))
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid duration. Must be a positive integer"}), 400

        session.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(session.to_dict())
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating study session: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return handle_error(e)

@bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_study_session(session_id):
    """Delete a study session."""
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
        db.session.rollback()
        current_app.logger.error(f"Error deleting study session: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return handle_error(e)

@bp.route('/sessions/stats', methods=['GET'])
@jwt_required()
def get_study_stats():
    """Get study statistics for the current user."""
    try:
        user_id = get_current_user()
        if not user_id:
            return jsonify({"error": "Invalid user"}), 401

        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build base query
        query = StudySession.query.filter_by(user_id=user_id)
        
        # Apply date filters
        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
                query = query.filter(StudySession.start_time >= start)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid start_date format. Use ISO 8601 format"}), 400
                
        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
                query = query.filter(StudySession.start_time <= end)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid end_date format. Use ISO 8601 format"}), 400
        
        # Get all sessions and filter them
        all_sessions = query.all()
        
        # Filter sessions - check subject for 'break' keyword
        sessions = []
        break_sessions = []
        
        for session in all_sessions:
            if not session.subject:
                sessions.append(session)  # Include sessions without subjects as study sessions
                continue
                
            subject_lower = session.subject.lower()
            is_break = 'break' in subject_lower
            
            if is_break:
                break_sessions.append(session)
            else:
                sessions.append(session)
        
        # Calculate statistics (excluding breaks)
        total_sessions = len(sessions)
        # Calculate total duration from valid study sessions
        total_duration = 0
        valid_sessions = []
        
        for session in sessions:
            duration = session.duration or 0
            if duration > 0:
                total_duration += duration
                valid_sessions.append(session)
        
        # Group by subject
        subjects = {}
        for session in sessions:
            # Skip sessions with no duration or negative duration
            if session.duration is None or session.duration <= 0:
                continue
                
            # Handle None or empty subject
            subject = session.subject.strip() if session.subject and session.subject.strip() else 'Uncategorized'
            
            # Initialize subject entry if it doesn't exist
            if subject not in subjects:
                subjects[subject] = {
                    'total_duration': 0,
                    'session_count': 0,
                    'last_studied': None
                }
            
            # Update subject statistics
            subjects[subject]['total_duration'] += session.duration
            subjects[subject]['session_count'] += 1
            
            # Update last studied date if this session is more recent
            if (session.end_time and 
                (subjects[subject]['last_studied'] is None or 
                 session.end_time > subjects[subject]['last_studied'])):
                subjects[subject]['last_studied'] = session.end_time
        
        # Sort subjects by total duration (descending)
        sorted_subjects = sorted(
            [{'subject': k, **v} for k, v in subjects.items()],
            key=lambda x: x['total_duration'],
            reverse=True
        )
        
        # Calculate break session stats
        total_break_sessions = len(break_sessions)
        total_break_duration = sum(s.duration or 0 for s in break_sessions)
        
        # Calculate daily stats for the last 30 days
        daily_stats = {}
        for i in range(30):
            date = (datetime.now() - timedelta(days=i)).date()
            daily_stats[date.isoformat()] = {
                'date': date.isoformat(),
                'total_duration': 0,
                'session_count': 0,
                'break_duration': 0,
                'break_count': 0
            }
        
        # Process all sessions (both study and break)
        all_sessions = sessions + break_sessions
        for session in all_sessions:
            # Skip sessions without end time or duration
            if not session.end_time or not session.duration or session.duration <= 0:
                continue
                
            session_date = session.end_time.date()
            date_str = session_date.isoformat()
            
            if date_str in daily_stats:
                is_break = session.subject and 'break' in session.subject.lower()
                duration = session.duration
                
                if is_break:
                    daily_stats[date_str]['break_duration'] += duration
                    daily_stats[date_str]['break_count'] += 1
                else:
                    daily_stats[date_str]['total_duration'] += duration
                    daily_stats[date_str]['session_count'] += 1
        
        # Convert to list and sort by date
        daily_stats = sorted(
            list(daily_stats.values()),
            key=lambda x: x['date'],
            reverse=True
        )
        
        return jsonify({
            'total_sessions': total_sessions,
            'total_duration': total_duration,
            'total_duration_minutes': total_duration // 60,
            'break_sessions': total_break_sessions,
            'break_duration': total_break_duration,
            'break_duration_minutes': total_break_duration // 60,
            'subjects': sorted_subjects,
            'daily_stats': daily_stats,
            'favorite_subject': sorted_subjects[0]['subject'] if sorted_subjects else None,
            'break_stats': {
                'total_sessions': total_break_sessions,
                'total_duration': total_break_duration,
                'total_duration_minutes': total_break_duration // 60
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting study stats: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return handle_error(e)
