from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import CalendarEvent
from app.utils import validate_request_data, parse_datetime
from app import db

bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_events():
    user_id = get_jwt_identity()
    events = CalendarEvent.query.filter_by(user_id=user_id).all()
    return jsonify([event.to_dict() for event in events]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_event():
    user_id = get_jwt_identity()
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
        user_id=user_id
    )
    
    db.session.add(new_event)
    db.session.commit()
    
    return jsonify(new_event.to_dict()), 201

@bp.route('/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    user_id = get_jwt_identity()
    event = CalendarEvent.query.filter_by(id=event_id, user_id=user_id).first()
    
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    data = request.get_json()
    
    # Update fields if provided
    if 'title' in data:
        event.title = data['title']
    if 'description' in data:
        event.description = data['description']
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

@bp.route('/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    user_id = get_jwt_identity()
    event = CalendarEvent.query.filter_by(id=event_id, user_id=user_id).first()
    
    if not event:
        return jsonify({"error": "Event not found"}), 404
    
    db.session.delete(event)
    db.session.commit()
    
    return jsonify({"message": "Event deleted successfully"}), 200
