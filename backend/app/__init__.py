from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from config import config
from flask_jwt_extended.exceptions import JWTExtendedException
from .extensions import db, jwt, limiter  # Import from extensions module
from .utils.csrf import init_csrf
from .middleware.cors_middleware import handle_cors
from .middleware.security_headers import security_headers

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Configure logging
    import logging
    logging.basicConfig(level=logging.INFO)  # Set to INFO level to reduce debug output
    logger = logging.getLogger(__name__)
    logger.info('Starting Flask application with config: %s', config_name)
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    
    # Initialize security middleware
    logger.info('Initializing security middleware')
    csrf = init_csrf(app)
    
    # Initialize security headers
    security_headers(app)
    
    # Initialize rate limiting
    limiter.init_app(app)
    
    # Apply CORS middleware to all routes
    @app.before_request
    @handle_cors()
    def before_request():
        pass
    
    # Configure CORS with permissive settings for development
    allowed_origins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3002',
        'http://127.0.0.1:3002'
    ]
    
    # Configure CORS with specific settings
    cors = CORS(
        app,
        resources={
            r"/api/*": {
                "origins": allowed_origins,
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                "allow_headers": ["Content-Type", "Authorization", "X-CSRFToken", "X-Requested-With"],
                "supports_credentials": True,
                "expose_headers": ["X-CSRFToken", "Content-Type", "Authorization"],
                "max_age": 3600
            }
        },
        supports_credentials=True,
        automatic_options=True
    )
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        
        # Only set CORS headers for allowed origins
        if origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            
        # Always allow these headers
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Expose-Headers'] = 'X-CSRFToken, Content-Type, Authorization'
        
        # Handle preflight requests
        if request.method == 'OPTIONS':
            # For preflight, we need to explicitly allow the requested headers and methods
            if 'Access-Control-Request-Headers' in request.headers:
                response.headers['Access-Control-Allow-Headers'] = request.headers.get(
                    'Access-Control-Request-Headers', 
                    'Content-Type, Authorization, X-CSRFToken, X-Requested-With'
                )
            if 'Access-Control-Request-Method' in request.headers:
                response.headers['Access-Control-Allow-Methods'] = request.headers.get(
                    'Access-Control-Request-Method',
                    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
                )
            response.status_code = 200
            
        return response
        return response


    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Your session has expired. Please log in again.'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({
            'error': 'Invalid authentication token'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return jsonify({
            'error': 'Authentication token is missing'
        }), 401

    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'A fresh login is required'
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Token has been revoked'
        }), 401
    

    
    with app.app_context():
        # Register blueprints
        from .routes.auth import bp as auth_bp
        from .routes.tasks import bp as tasks_bp
        from .routes.calendar import bp as calendar_bp
        from .routes.study import bp as study_bp
        from .routes.ai_routes import gemini_bp
        
        app.register_blueprint(auth_bp)
        app.register_blueprint(tasks_bp)
        app.register_blueprint(calendar_bp)
        app.register_blueprint(study_bp)
        app.register_blueprint(gemini_bp)
        
        # Create database tables if they don't exist
        db.create_all()
        
    return app
