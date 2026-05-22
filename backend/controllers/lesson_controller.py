from flask import request, jsonify, g
from controllers import handle_errors
import services.lesson_service as svc


@handle_errors
def get_lessons():
    q = request.args.get("q", "").strip()
    return jsonify({"success": True, "data": svc.get_lessons(g.user["user_id"], q)})


@handle_errors
def get_lesson(lesson_id):
    return jsonify({"success": True, "data": svc.get_lesson(lesson_id)})


@handle_errors
def create_lesson():
    title = (request.json or {}).get("title", "").strip()
    if not title:
        return jsonify({"success": False, "message": "Tiêu đề không được trống"}), 400
    svc.create_lesson(g.user["user_id"], title)
    return jsonify({"success": True, "message": "Tạo bài học thành công"})


@handle_errors
def update_lesson(lesson_id):
    title = (request.json or {}).get("title", "").strip()
    if not title:
        return jsonify({"success": False, "message": "Tiêu đề không được trống"}), 400
    svc.update_lesson(lesson_id, g.user["user_id"], title)
    return jsonify({"success": True, "message": "Cập nhật bài học thành công"})


@handle_errors
def delete_lesson(lesson_id):
    svc.delete_lesson(lesson_id, g.user["user_id"])
    return jsonify({"success": True, "message": "Đã xóa bài học"})
