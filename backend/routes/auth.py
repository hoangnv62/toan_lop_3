from flask import Blueprint, request, jsonify, g
from utils import get_db, create_token, require_auth, hash_password, verify_password

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/register/teacher", methods=["POST"])
def register_teacher():
    d = request.json or {}
    username  = d.get("username", "").strip()
    password  = d.get("password", "")
    full_name = d.get("full_name", "").strip()

    if not username or not password or not full_name:
        return jsonify({"success": False, "message": "Vui lòng điền đầy đủ thông tin"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id FROM users WHERE username=%s", (username,))
    if cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Tên đăng nhập đã tồn tại"}), 409

    cur.execute(
        "INSERT INTO users (username, password, full_name, role) VALUES (%s,%s,%s,'teacher')",
        (username, hash_password(password), full_name)
    )
    conn.commit()
    uid = cur.lastrowid
    cur.close(); conn.close()

    token = create_token(uid, "teacher", full_name)
    return jsonify({"success": True, "token": token, "user": {"user_id": uid, "role": "teacher", "name": full_name}}), 201


@auth_bp.route("/api/auth/register/student", methods=["POST"])
def register_student():
    d = request.json or {}
    username  = d.get("username", "").strip()
    password  = d.get("password", "")
    full_name = d.get("full_name", "").strip()
    dob       = d.get("dob") or None

    if not username or not password or not full_name:
        return jsonify({"success": False, "message": "Vui lòng điền đầy đủ thông tin"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT id FROM users WHERE username=%s", (username,))
    if cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Tên đăng nhập đã tồn tại"}), 409

    cur.execute(
        "INSERT INTO users (username, password, full_name, role, dob) VALUES (%s,%s,%s,'student',%s)",
        (username, hash_password(password), full_name, dob)
    )
    conn.commit()
    uid = cur.lastrowid
    cur.close(); conn.close()

    token = create_token(uid, "student", full_name)
    return jsonify({"success": True, "token": token, "user": {"user_id": uid, "role": "student", "name": full_name}}), 201


@auth_bp.route("/api/auth/login/teacher", methods=["POST"])
def login_teacher():
    d = request.json or {}
    username = d.get("username", "").strip()
    password = d.get("password", "")
    if not username or not password:
        return jsonify({"success": False, "message": "Thiếu tên đăng nhập hoặc mật khẩu"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE username=%s AND role='teacher'", (username,))
    u = cur.fetchone()
    cur.close(); conn.close()

    if not u or not verify_password(u["password"], password):
        return jsonify({"success": False, "message": "Sai tài khoản hoặc mật khẩu"}), 401

    token = create_token(u["id"], "teacher", u["full_name"])
    return jsonify({"success": True, "token": token, "user": {"user_id": u["id"], "role": "teacher", "name": u["full_name"]}})


@auth_bp.route("/api/auth/login/student", methods=["POST"])
def login_student():
    d = request.json or {}
    username = d.get("username", "").strip()
    password = d.get("password", "")
    if not username or not password:
        return jsonify({"success": False, "message": "Thiếu tên đăng nhập hoặc mật khẩu"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE username=%s AND role='student'", (username,))
    u = cur.fetchone()
    cur.close(); conn.close()

    if not u or not verify_password(u["password"], password):
        return jsonify({"success": False, "message": "Sai tài khoản hoặc mật khẩu"}), 401

    token = create_token(u["id"], "student", u["full_name"])
    return jsonify({"success": True, "token": token, "user": {"user_id": u["id"], "role": "student", "name": u["full_name"]}})


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    return jsonify({"success": True})


@auth_bp.route("/api/auth/me")
@require_auth
def me():
    return jsonify({"success": True, "data": {
        "logged_in": True,
        "user_id": g.user["user_id"],
        "role":    g.user["role"],
        "name":    g.user["name"],
    }})
