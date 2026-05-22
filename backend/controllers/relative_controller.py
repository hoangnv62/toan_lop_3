from flask import request, jsonify, g
from controllers import handle_errors
from repositories.user_repository import UserRepository
import services.relative_service as svc
from errors import ForbiddenError

user_repo = UserRepository()


@handle_errors
def get_relatives(student_id):
    uid  = g.user["user_id"]
    role = g.user["role"]
    if role == "student" and uid != student_id:
        raise ForbiddenError("Không có quyền truy cập")
    if role == "teacher":
        from sqlalchemy import text
        from extensions import db
        row = db.session.execute(
            text("SELECT u.id FROM users u JOIN classes c ON u.class_id=c.id WHERE u.id=:sid AND c.teacher_id=:tid"),
            {"sid": student_id, "tid": uid}
        ).first()
        if not row:
            raise ForbiddenError("Không có quyền truy cập")
    return jsonify({"success": True, "data": svc.get_relatives(student_id)})


@handle_errors
def add_relative(student_id):
    uid  = g.user["user_id"]
    role = g.user["role"]
    if role != "student" or uid != student_id:
        return jsonify({"success": False, "message": "Chỉ học sinh mới có thể thêm người thân"}), 403
    data         = request.json or {}
    name         = (data.get("name") or "").strip()
    phone        = (data.get("phone") or "").strip()
    relationship = (data.get("relationship") or "").strip() or None
    if not name or not phone:
        return jsonify({"success": False, "message": "Tên và số điện thoại không được trống"}), 400
    new_id = svc.add_relative(student_id, name, phone, relationship)
    return jsonify({"success": True, "message": "Đã thêm người thân", "data": {"id": new_id}}), 201


@handle_errors
def update_relative(relative_id):
    if g.user["role"] != "student":
        return jsonify({"success": False, "message": "Chỉ học sinh mới có thể sửa người thân"}), 403
    data         = request.json or {}
    name         = (data.get("name") or "").strip()
    phone        = (data.get("phone") or "").strip()
    relationship = (data.get("relationship") or "").strip() or None
    if not name or not phone:
        return jsonify({"success": False, "message": "Tên và số điện thoại không được trống"}), 400
    svc.update_relative(relative_id, g.user["user_id"], name, phone, relationship)
    return jsonify({"success": True, "message": "Đã cập nhật người thân"})


@handle_errors
def delete_relative(relative_id):
    if g.user["role"] != "student":
        return jsonify({"success": False, "message": "Chỉ học sinh mới có thể xóa người thân"}), 403
    svc.delete_relative(relative_id, g.user["user_id"])
    return jsonify({"success": True, "message": "Đã xóa người thân"})
