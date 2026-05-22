from functools import wraps
from flask import jsonify
from errors import AppError


def handle_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except AppError as e:
            return jsonify({"success": False, "message": e.message}), e.status_code
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500
    return wrapper
