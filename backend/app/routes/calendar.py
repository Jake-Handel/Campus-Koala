from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.utils import validate_request_data, parse_datetime
from app import db

bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')

import traceback
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_events():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        logger.debug('Attempting to fetch events')
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401
        logger.debug(f'Querying events for user_id: {user_id}')
        events = CalendarEvent.query.filter_by(user_id=user_id).all()
        logger.debug(f'Found {len(events)} events')
        event_list = [event.to_dict() for event in events]
        logger.debug('Successfully serialized events')
        return jsonify(event_list), 200
    except Exception as e:
        logger.error(f'Error in get_events: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500

@bp.route('/', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_event():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401
        data = request.get_json()
        
        # Validate required fields
        valid, error = validate_request_data(data, ['title', 'start_time', 'end_time'])
        if not valid:
            return jsonify({'error': error}), 400
        
        # Parse datetime fields
        start_time = parse_datetime(data['start_time'])
        end_time = parse_datetime(data['end_time'])
        
        if not start_time or not end_time:
            return jsonify({'error': 'Invalid datetime format'}), 400
        
        if end_time <= start_time:
            return jsonify({'error': 'End time must be after start time'}), 400
        
        new_event = CalendarEvent(
            title=data['title'],
            description=data.get('description'),
            start_time=start_time,
            end_time=end_time,
            category=data.get('category'),
            location=data.get('location'),
            user_id=user_id
        )
        
        db.session.add(new_event)
        db.session.commit()
        
        return jsonify(new_event.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:event_id>', methods=['PUT', 'PATCH', 'OPTIONS'])
@jwt_required()
def update_event(event_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401
        event = CalendarEvent.query.filter_by(id=event_id, user_id=user_id).first()
        
        if not event:
            return jsonify({"error": "Event not found"}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'title' in data:
            event.title = data['title']
        if 'description' in data:
            event.description = data['description']
        if 'category' in data:
            event.category = data['category']
        if 'location' in data:
            event.location = data['location']
        if 'start_time' in data:
            start_time = parse_datetime(data['start_time'])
            if not start_time:
                return jsonify({'error': 'Invalid start time format'}), 400
            event.start_time = start_time
        if 'end_time' in data:
            end_time = parse_datetime(data['end_time'])
            if not end_time:
                return jsonify({'error': 'Invalid end time format'}), 400
            event.end_time = end_time
        
        if event.end_time <= event.start_time:
            return jsonify({'error': 'End time must be after start time'}), 400
        
        db.session.commit()
        return jsonify(event.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:event_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_event(event_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
            
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401
        event = CalendarEvent.query.filter_by(id=event_id, user_id=user_id).first()
        
        if not event:
            return jsonify({"error": "Event not found"}), 404
        
        db.session.delete(event)
        db.session.commit()
        
        return jsonify({"message": "Event deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
