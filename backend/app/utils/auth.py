from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User  # Import directly from user model to avoid circular imports

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or not user.is_admin:
                return jsonify({"msg": "Admins only!"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
