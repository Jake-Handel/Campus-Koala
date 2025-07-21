from flask import request, jsonify, make_response
from functools import wraps

def handle_cors():
    """
    Middleware to handle CORS preflight requests and add CORS headers to responses.
    This is necessary for the frontend to work with CSRF protection.
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = make_response()
                response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CSRFToken')
                response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
                response.headers.add('Access-Control-Allow-Credentials', 'true')
                response.headers.add('Access-Control-Max-Age', '3600')
                return response
                
            # For actual requests, call the original function
            return f(*args, **kwargs)
        return wrapped
    return decorator
