from flask import Blueprint, request, jsonify, g
from utils import get_db, create_token, require_auth, hash_password, verify_password

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/login/teacher", methods=["POST"])
def login_teacher():
    d = request.json or {}
    username = d.get("username", "").strip()
    password = d.get("password", "")
    if not username or not password:
        return jsonify({"success": False, "message": "Thiếu tên đăng nhập hoặc mật khẩu"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM teachers WHERE username=%s", (username,))
    u = cur.fetchone()
    cur.close()
    conn.close()

    if not u or not verify_password(u["password"], password):
        return jsonify({"success": False, "message": "Sai tài khoản hoặc mật khẩu"}), 401

    token = create_token(u["id"], "teacher", u["full_name"])
    return jsonify({"success": True, "token": token, "user": {"role": "teacher", "name": u["full_name"]}})


@auth_bp.route("/api/auth/check-phone", methods=["POST"])
def check_phone():
    p = (request.json or {}).get("phone", "").strip()
    if not p:
        return jsonify({"success": False, "message": "Thiếu số điện thoại"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, full_name, password FROM students WHERE parent_phone=%s", (p,))
    u = cur.fetchone()
    cur.close()
    conn.close()

    if u:
        return jsonify({"success": True, "data": {
            "exists": True, "has_password": bool(u["password"]), "name": u["full_name"],
        }})
    return jsonify({"success": True, "data": {"exists": False}})


@auth_bp.route("/api/auth/login/student", methods=["POST"])
def login_student():
    d = request.json or {}
    phone = d.get("phone", "").strip()
    password = d.get("password", "")

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM students WHERE parent_phone = %s", (phone,))
    u = cur.fetchone()

    if not u:
        cur.close()
        conn.close()
        return jsonify({"success": False, "message": "Số điện thoại chưa được đăng ký trong hệ thống"}), 404

    if not u["password"]:
        hashed = hash_password(password)
        cur.execute("UPDATE students SET password = %s WHERE id = %s", (hashed, u["id"]))
        conn.commit()
        cur.close()
        conn.close()
        token = create_token(u["id"], "student", u["full_name"])
        return jsonify({"success": True, "token": token, "user": {"role": "student", "name": u["full_name"]}})

    cur.close()
    conn.close()

    if not verify_password(u["password"], password):
        return jsonify({"success": False, "message": "Sai mật khẩu"}), 401

    token = create_token(u["id"], "student", u["full_name"])
    return jsonify({"success": True, "token": token, "user": {"role": "student", "name": u["full_name"]}})


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    return jsonify({"success": True})


@auth_bp.route("/api/auth/me")
@require_auth
def me():
    return jsonify({"success": True, "data": {
        "logged_in": True,
        "user_id": g.user["user_id"],
        "role": g.user["role"],
        "name": g.user["name"],
    }})
