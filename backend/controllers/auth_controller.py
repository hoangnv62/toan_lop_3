from flask import request, jsonify, g
from controllers import handle_errors
import services.auth_service as svc


@handle_errors
def register_teacher():
    d         = request.json or {}
    username  = d.get("username", "").strip()
    password  = d.get("password", "")
    full_name = d.get("full_name", "").strip()
    if not username or not password or not full_name:
        return jsonify({"success": False, "message": "Vui lòng điền đầy đủ thông tin"}), 400
    token, user = svc.register(username, password, full_name, "teacher")
    return jsonify({"success": True, "token": token, "user": {"user_id": user.id, "role": "teacher", "name": user.full_name}}), 201


@handle_errors
def register_student():
    d         = request.json or {}
    username  = d.get("username", "").strip()
    password  = d.get("password", "")
    full_name = d.get("full_name", "").strip()
    dob       = d.get("dob") or None
    if not username or not password or not full_name:
        return jsonify({"success": False, "message": "Vui lòng điền đầy đủ thông tin"}), 400
    token, user = svc.register(username, password, full_name, "student", dob)
    return jsonify({"success": True, "token": token, "user": {"user_id": user.id, "role": "student", "name": user.full_name}}), 201


@handle_errors
def login_teacher():
    d        = request.json or {}
    username = d.get("username", "").strip()
    password = d.get("password", "")
    if not username or not password:
        return jsonify({"success": False, "message": "Thiếu tên đăng nhập hoặc mật khẩu"}), 400
    token, user = svc.login(username, password, "teacher")
    return jsonify({"success": True, "token": token, "user": {"user_id": user.id, "role": "teacher", "name": user.full_name}})


@handle_errors
def login_student():
    d        = request.json or {}
    username = d.get("username", "").strip()
    password = d.get("password", "")
    if not username or not password:
        return jsonify({"success": False, "message": "Thiếu tên đăng nhập hoặc mật khẩu"}), 400
    token, user = svc.login(username, password, "student")
    return jsonify({"success": True, "token": token, "user": {"user_id": user.id, "role": "student", "name": user.full_name}})


def logout():
    return jsonify({"success": True})


def me():
    return jsonify({"success": True, "data": {
        "logged_in": True,
        "user_id":   g.user["user_id"],
        "role":      g.user["role"],
        "name":      g.user["name"],
    }})


@handle_errors
def get_profile():
    return jsonify({"success": True, "data": svc.get_profile(g.user["user_id"])})


@handle_errors
def update_profile():
    d         = request.json or {}
    full_name = d.get("fullName", "").strip()
    if not full_name:
        return jsonify({"success": False, "message": "Họ tên không được trống"}), 400
    dob   = d.get("dob") or None
    email = (d.get("email") or "").strip() or None
    phone = (d.get("phone") or "").strip() or None
    svc.update_profile(g.user["user_id"], full_name, dob, email, phone)
    return jsonify({"success": True, "message": "Đã cập nhật"})


@handle_errors
def change_password():
    d          = request.json or {}
    current_pw = d.get("currentPassword", "")
    new_pw     = d.get("newPassword", "")
    if not current_pw or not new_pw:
        return jsonify({"success": False, "message": "Vui lòng điền đầy đủ thông tin"}), 400
    if len(new_pw) < 6:
        return jsonify({"success": False, "message": "Mật khẩu mới phải có ít nhất 6 ký tự"}), 400
    svc.change_password(g.user["user_id"], current_pw, new_pw)
    return jsonify({"success": True, "message": "Đổi mật khẩu thành công"})
