from flask import Blueprint, request, jsonify, abort, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_limiter.util import get_remote_address
from sqlalchemy.exc import IntegrityError
from app import db
from app.models import User
from app.extensions import limiter
import re
from app.utils import validate_request_data
from datetime import timedelta
import traceback

# Rate limiting configuration
def get_remote_identifier():
    # Use JWT identity if available, otherwise use IP address
    try:
        return str(get_jwt_identity() or request.remote_addr)
    except:
        return request.remote_addr

bp = Blueprint('auth', __name__, url_prefix='/api')

@limiter.limit("5 per hour", key_func=get_remote_identifier)
@bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        
        # Validate required fields
        valid, error = validate_request_data(data, ['username', 'email', 'password'])
        if not valid:
            return jsonify({'error': error}), 400
        
        password = data['password']
        # Validate password strength
        errors = []
        if len(password) < 8:
            errors.append("be at least 8 characters long")
        if not re.search(r'[A-Z]', password):
            errors.append("include at least one uppercase letter (A-Z)")
        if not re.search(r'[a-z]', password):
            errors.append("include at least one lowercase letter (a-z)")
        if not re.search(r'[0-9]', password):
            errors.append("include at least one number (0-9)")
        if not re.search(r'[@$!%*?&]', password):
            errors.append("include at least one special character (@$!%*?&)")
            
        if errors:
            description = "Password must: " + ", ".join(errors)
            return abort(400, description=description)
            
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
            
        # Create new user
        user = User.create(
            username=data['username'],
            email=data['email'],
            password=data['password']
        )
        
        # Generate access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Registration successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@limiter.limit("10 per hour", key_func=get_remote_address)
@bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        try:
            data = request.get_json()
        except Exception as e:
            return jsonify({"error": "Invalid request data"}), 400
        
        # Validate required fields
        valid, error = validate_request_data(data, ['username', 'password'])
        if not valid:

            return jsonify({'error': error}), 400
        
        # Find user and verify password
        user = User.query.filter_by(username=data['username']).first()
        if not user:

            return jsonify({"error": "Invalid username or password"}), 401
            
        if not user.verify_password(data['password']):

            return jsonify({"error": "Invalid username or password"}), 401
        
        # Generate access token with additional claims
        additional_claims = {
            'username': user.username,
            'type': 'access'
        }
        
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims,
            fresh=True
        )
        
        response = jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        })
        response.headers['Authorization'] = f'Bearer {access_token}'
        return response, 200
        
    except Exception as e:

        return jsonify({"error": "An error occurred during login"}), 500

@bp.route('/profile', methods=['GET', 'OPTIONS'])
@jwt_required()
def profile():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
