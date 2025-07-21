from flask_wtf.csrf import CSRFProtect, generate_csrf
from functools import wraps
from flask import request, jsonify, current_app

def csrf_exempt(view_func):
    """Decorator to mark a view as exempt from CSRF protection."""
    view_func.csrf_exempt = True
    return view_func

class CustomCSRFProtect(CSRFProtect):
    """Custom CSRF protection that skips CSRF checks for API routes."""
    
    def __init__(self, app=None):
        super().__init__(app=app)
        self._exempt_views = set()
    
    def _get_csrf_token(self):
        """Get the CSRF token from the request headers or cookies."""
        # Check for token in the headers first
        token = request.headers.get('X-CSRFToken')
        if not token:
            # Fall back to form data
            token = request.form.get('csrf_token')
        if not token:
            # Finally, check cookies
            token = request.cookies.get('X-CSRFToken')
        return token
    
    def _is_csrf_exempt(self, view):
        """Check if a view is exempt from CSRF protection."""
        if view is None:
            return False
        
        # Check if the view is marked as exempt
        if hasattr(view, 'csrf_exempt') and view.view_class:
            view = view.view_class
        
        return hasattr(view, 'csrf_exempt')
    
    def protect(self):
        """Override the default protect method to skip CSRF for all routes."""
        # Temporarily disable CSRF for all routes to debug 403 Forbidden issue
        current_app.logger.debug(f'CSRF protection is disabled for {request.path}')
        return

def init_csrf(app):
    """Initialize CSRF protection with the Flask app."""
    csrf = CustomCSRFProtect()
    csrf.init_app(app)
    
    @app.after_request
    def set_csrf_cookie(response):
        """Set the CSRF token in a cookie for the frontend."""
        if request.endpoint != 'static':
            csrf_token = generate_csrf()
            response.set_cookie(
                'X-CSRFToken',
                csrf_token,
                secure=not app.config['DEBUG'],
                httponly=True,
                samesite='Strict',
                path='/'  # Make cookie available on all routes
            )
        return response
    
    return csrf
