from flask import Blueprint, request, jsonify, make_response, current_app
from flask_jwt_extended import jwt_required, get_current_user
from flask_jwt_extended.exceptions import NoAuthorizationError, InvalidHeaderError
from datetime import datetime
from app.models.task import Task
from app import db

bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')

@bp.errorhandler(NoAuthorizationError)
@bp.errorhandler(InvalidHeaderError)
def handle_auth_error(e):
    return jsonify({"error": str(e)}), 401

@bp.route('', methods=['GET'])  
@bp.route('/', methods=['GET'])  
@jwt_required()
def get_tasks():
    try:
        # Get current user from JWT token
        current_user = get_current_user()
        if not current_user:
            return jsonify({"error": "User not found"}), 401

        tasks = Task.query.filter_by(user_id=current_user.id).all()
        return jsonify([task.to_dict() for task in tasks]), 200
    except Exception as e:

        return jsonify({"error": str(e)}), 422

@bp.route('', methods=['POST'])
@bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"error": "User not found"}), 401

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        required_fields = ['title']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Convert string date to datetime if provided
        due_date = None
        if data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"error": "Invalid due date format"}), 400

        new_task = Task(
            title=data['title'].strip(),
            description=data.get('description', '').strip(),
            due_date=due_date,
            priority=data.get('priority', 1),
            user_id=current_user.id,
            completed=False
        )

        db.session.add(new_task)
        db.session.commit()
        return jsonify(new_task.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/<int:task_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_task(task_id):
    try:
        # Get current user from JWT token
        current_user = get_current_user()
        if not current_user:
            return jsonify({"error": "User not found"}), 401

        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
        
        if not task:
            return jsonify({"error": "Task not found"}), 404
        
        data = request.get_json()
        
        # For PATCH requests, only update specified fields
        if request.method == 'PATCH':
            if 'completed' in data:
                task.completed = data['completed']
        # For PUT requests, update all fields if provided
        else:
            if 'title' in data:
                task.title = data['title']
            if 'description' in data:
                task.description = data['description']
            if 'due_date' in data:
                task.due_date = parse_datetime(data['due_date'])
            if 'completed' in data:
                task.completed = data['completed']
            if 'priority' in data:
                task.priority = data['priority']
            if 'calendar_event_id' in data:
                task.calendar_event_id = data['calendar_event_id']
        
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 422

@bp.route('/<int:task_id>', methods=['DELETE'])  
@jwt_required()
def delete_task(task_id):
    try:
        # Get current user from JWT token
        current_user = get_current_user()
        if not current_user:
            return jsonify({"error": "User not found"}), 401

        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
        
        if not task:
            return jsonify({"error": "Task not found"}), 404
        
        db.session.delete(task)
        db.session.commit()
        
        return jsonify({"message": "Task deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 422
