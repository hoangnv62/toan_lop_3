import re
import jwt
import mysql.connector
from mysql.connector import pooling
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from config import db_config, app_secret_key

_JWT_ALGORITHM = 'HS256'
_JWT_EXPIRE_HOURS = 24

_pool = None


def _get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="mathpool",
            pool_size=10,
            pool_reset_session=True,
            **db_config,
        )
    return _pool


def get_db():
    return _get_pool().get_connection()


def hash_password(plain: str) -> str:
    return generate_password_hash(plain)


def verify_password(stored: str, provided: str) -> bool:
    if not stored:
        return False
    if stored.startswith(('pbkdf2:', 'scrypt:')):
        return check_password_hash(stored, provided)
    return stored == provided  # backward-compat: legacy plaintext


def clean_json_string(text):
    try:
        match = re.search(r'\[.*\]', text, re.DOTALL)
        return match.group(0) if match else '[]'
    except Exception:
        return '[]'


def create_token(user_id, role, name):
    payload = {
        'user_id': user_id,
        'role': role,
        'name': name,
        'exp': datetime.now(timezone.utc) + timedelta(hours=_JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, app_secret_key, algorithm=_JWT_ALGORITHM)


def decode_token(token):
    return jwt.decode(token, app_secret_key, algorithms=[_JWT_ALGORITHM])


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Token required'}), 401
        try:
            g.user = decode_token(auth[7:])
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token expired'}), 401
        except Exception:
            return jsonify({'success': False, 'message': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated
