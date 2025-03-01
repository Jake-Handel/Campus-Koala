from flask import Blueprint, request, jsonify, make_response, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request, get_jwt
from flask_jwt_extended.exceptions import NoAuthorizationError, InvalidHeaderError, JWTExtendedException
from datetime import datetime, timedelta
from app.models.task import Task
from app.models.user import User
from app.models.calendar_event import CalendarEvent
from app import db
import traceback
import json

bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')

def get_current_user():
    """Helper function to get and validate current user"""
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return None
        
    current_user = User.query.get(user_id)
    if not current_user:
        return None
        
    return current_user

@bp.errorhandler(NoAuthorizationError)
@bp.errorhandler(InvalidHeaderError)
@bp.errorhandler(JWTExtendedException)
def handle_auth_error(e):
    return jsonify({"error": "Authentication failed. Please log in again."}), 401

@bp.route('', methods=['GET', 'OPTIONS'])  
@bp.route('/', methods=['GET', 'OPTIONS'])  
@jwt_required()
def get_tasks():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Get user ID from JWT token
        user_id = get_jwt_identity()
        
        if user_id is None:

            return jsonify({"error": "Authentication required"}), 401
            
        try:
            user_id = int(user_id)  # Convert string ID back to integer
        except (ValueError, TypeError):

            return jsonify({"error": "Invalid authentication token"}), 401
        
        # Verify user exists
        current_user = User.query.get(user_id)
        if current_user is None:

            return jsonify({"error": "User not found"}), 401
        

        
        # Get tasks for user
        tasks = Task.query.filter_by(user_id=current_user.id).all()
        

        
        response = jsonify([task.to_dict() for task in tasks])
        return response, 200
    except JWTExtendedException as e:
        return jsonify({"error": "Authentication failed. Please log in again."}), 401
    except Exception as e:
        return jsonify({"error": "Failed to fetch tasks. Please try again."}), 500

@bp.route('', methods=['POST', 'OPTIONS'])
@bp.route('/', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_task():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"error": "Authentication failed"}), 401
            
        # Parse request data
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
        except Exception as e:
            return jsonify({"error": "Invalid JSON data"}), 400

        # Validate required fields
        if 'title' not in data:
            return jsonify({"error": "Title is required"}), 400

        title = data['title'].strip()
        if not title:
            return jsonify({"error": "Title cannot be empty"}), 400

        try:
            # Create task with validated data
            task = Task(
                title=title,
                description=data.get('description', '').strip(),
                user_id=current_user.id,
                completed=bool(data.get('completed', False)),
                priority=int(data.get('priority', 1))
            )

            if 'due_date' in data and data['due_date']:
                try:
                    task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                    
                    # Create a calendar event for this task
                    calendar_event = CalendarEvent(
                        title=task.title,
                        description=task.description,
                        start_time=task.due_date,
                        end_time=task.due_date + timedelta(hours=1),  # Default 1 hour duration
                        user_id=current_user.id,
                        category="Todo",  # Special category for todo items
                        location=""
                    )
                    db.session.add(calendar_event)
                    db.session.flush()  # Get the calendar_event.id before commit
                    task.calendar_event_id = calendar_event.id
                    
                except ValueError:
                    return jsonify({"error": "Invalid due date format"}), 400
            elif 'due_date' in data and not data['due_date']:
                # If due_date is provided but empty, set it to None
                task.due_date = None

            db.session.add(task)
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                return jsonify({"error": f"Database error: {str(e)}"}), 500
            

            return jsonify(task.to_dict()), 201

        except ValueError as e:

            return jsonify({"error": "Invalid value provided"}), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Failed to create task"}), 500
            
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred"}), 500

@bp.route('/<int:task_id>', methods=['PUT', 'PATCH', 'OPTIONS'])
@jwt_required(optional=True)
def update_task(task_id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Methods', 'PUT, PATCH, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response
        

    
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"error": "Authentication failed"}), 401

        # Find task
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
        if not task:
            return jsonify({"error": "Task not found"}), 404
            
        # Parse request data
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
        except Exception as e:
            return jsonify({"error": "Invalid JSON data"}), 400
            
        # Update task fields based on request method
        try:
            if request.method == 'PATCH':

                # For PATCH, only update specified fields
                if 'completed' in data:
                    task.completed = bool(data['completed'])
    
                if 'title' in data:
                    task.title = data['title'].strip()
                if 'description' in data:
                    task.description = data.get('description', '').strip()
                if 'priority' in data:
                    task.priority = int(data['priority'])
                if 'due_date' in data and data['due_date']:
                    try:
                        task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                        
                        # Update existing calendar event or create a new one
                        if task.calendar_event_id:
                            calendar_event = CalendarEvent.query.get(task.calendar_event_id)
                            if calendar_event:
                                calendar_event.title = task.title
                                calendar_event.description = task.description
                                calendar_event.start_time = task.due_date
                                calendar_event.end_time = task.due_date + timedelta(hours=1)
                            else:
                                # Create new calendar event if the linked one doesn't exist
                                calendar_event = CalendarEvent(
                                    title=task.title,
                                    description=task.description,
                                    start_time=task.due_date,
                                    end_time=task.due_date + timedelta(hours=1),
                                    user_id=current_user.id,
                                    category="Todo",
                                    location=""
                                )
                                db.session.add(calendar_event)
                                db.session.flush()
                                task.calendar_event_id = calendar_event.id
                        else:
                            # Create new calendar event
                            calendar_event = CalendarEvent(
                                title=task.title,
                                description=task.description,
                                start_time=task.due_date,
                                end_time=task.due_date + timedelta(hours=1),
                                user_id=current_user.id,
                                category="Todo",
                                location=""
                            )
                            db.session.add(calendar_event)
                            db.session.flush()
                            task.calendar_event_id = calendar_event.id
                    except ValueError:
                        return jsonify({"error": "Invalid due date format"}), 400
                elif 'due_date' in data and not data['due_date']:
                    # If due_date is provided but empty, set it to None and remove calendar event
                    task.due_date = None
                    if task.calendar_event_id:
                        calendar_event = CalendarEvent.query.get(task.calendar_event_id)
                        if calendar_event:
                            db.session.delete(calendar_event)
                        task.calendar_event_id = None
            else:  # PUT request
                current_app.logger.debug(f'PUT request data: {data}')
                # Validate required fields
                if 'title' not in data:
                    return jsonify({"error": "Title is required"}), 400
                    
                # Update all fields
                task.title = data['title'].strip()
                task.description = data.get('description', '').strip()
                task.completed = bool(data.get('completed', False))
                task.priority = int(data.get('priority', 1))
                
                # Task completion status is already set above
                
                if 'due_date' in data and data['due_date']:
                    try:
                        task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                        
                        # Update existing calendar event or create a new one
                        if task.calendar_event_id:
                            calendar_event = CalendarEvent.query.get(task.calendar_event_id)
                            if calendar_event:
                                calendar_event.title = task.title
                                calendar_event.description = task.description
                                calendar_event.start_time = task.due_date
                                calendar_event.end_time = task.due_date + timedelta(hours=1)
                            else:
                                # Create new calendar event if the linked one doesn't exist
                                calendar_event = CalendarEvent(
                                    title=task.title,
                                    description=task.description,
                                    start_time=task.due_date,
                                    end_time=task.due_date + timedelta(hours=1),
                                    user_id=current_user.id,
                                    category="Todo",
                                    location=""
                                )
                                db.session.add(calendar_event)
                                db.session.flush()
                                task.calendar_event_id = calendar_event.id
                        else:
                            # Create new calendar event
                            calendar_event = CalendarEvent(
                                title=task.title,
                                description=task.description,
                                start_time=task.due_date,
                                end_time=task.due_date + timedelta(hours=1),
                                user_id=current_user.id,
                                category="Todo",
                                location=""
                            )
                            db.session.add(calendar_event)
                            db.session.flush()
                            task.calendar_event_id = calendar_event.id
                    except ValueError:
                        return jsonify({"error": "Invalid due date format"}), 400
                elif 'due_date' in data and not data['due_date']:
                    # If due_date is provided but empty, set it to None and remove calendar event
                    task.due_date = None
                    if task.calendar_event_id:
                        calendar_event = CalendarEvent.query.get(task.calendar_event_id)
                        if calendar_event:
                            db.session.delete(calendar_event)
                        task.calendar_event_id = None
            
            # Save changes
            try:
                db.session.commit()
                current_app.logger.info(f'Successfully updated task {task_id}')
                return jsonify(task.to_dict()), 200
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f'Database error while updating task: {str(e)}\nTraceback: {traceback.format_exc()}')
                return jsonify({"error": "Failed to save task updates"}), 500
            
        except ValueError as e:
            return jsonify({"error": "Invalid value provided"}), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Failed to update task"}), 500
            
    except JWTExtendedException as e:
        return jsonify({"error": "Authentication failed. Please log in again."}), 401
    except Exception as e:
        return jsonify({"error": "An error occurred while updating the task"}), 500

@bp.route('/<int:task_id>', methods=['DELETE', 'OPTIONS'])  
@jwt_required()
def delete_task(task_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"error": "Authentication failed"}), 401

        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
        if not task:
            return jsonify({"error": "Task not found"}), 404
            
        # Delete associated calendar event if it exists
        if task.calendar_event_id:
            calendar_event = CalendarEvent.query.get(task.calendar_event_id)
            if calendar_event:
                db.session.delete(calendar_event)
        
        db.session.delete(task)
        db.session.commit()
        
        return jsonify({"message": "Task deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "An error occurred while processing your request"}), 500
