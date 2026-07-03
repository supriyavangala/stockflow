from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from models import User


def get_current_user():
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return User.query.get(user_id)


def require_org(fn):
    """Decorator: verifies JWT, loads current user, and injects `user` kwarg.
    Returns 401 if user no longer exists (e.g. deleted)."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = get_current_user()
        if not user:
            return jsonify({"error": "user not found"}), 401
        return fn(*args, user=user, **kwargs)

    return wrapper
