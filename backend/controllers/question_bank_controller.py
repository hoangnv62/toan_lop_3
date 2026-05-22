from flask import request, jsonify, g
from controllers import handle_errors
import services.question_bank_service as svc


@handle_errors
def list_questions():
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    return jsonify({"success": True, "data": svc.list_questions(g.user["user_id"])})


@handle_errors
def create_question():
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    data    = request.get_json() or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"success": False, "message": "Nội dung câu hỏi không được trống"}), 400
    new_id = svc.create_question(g.user["user_id"], content, data.get("explanation") or None, data.get("answers", []))
    return jsonify({"success": True, "id": new_id}), 201


@handle_errors
def update_question(question_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    data    = request.get_json() or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"success": False, "message": "Nội dung câu hỏi không được trống"}), 400
    svc.update_question(question_id, g.user["user_id"], content, data.get("explanation") or None, data.get("answers", []))
    return jsonify({"success": True, "message": "Đã cập nhật câu hỏi"})


@handle_errors
def delete_question(question_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    svc.delete_question(question_id, g.user["user_id"])
    return jsonify({"success": True, "message": "Đã xóa câu hỏi"})
