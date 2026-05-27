from flask import request, jsonify, g, send_file
from controllers import handle_errors
import services.question_bank_service as svc


@handle_errors
def list_questions():
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    q          = request.args.get("q", "").strip()
    page       = request.args.get("page",  1,  type=int)
    limit      = request.args.get("limit", 10, type=int)
    lesson_raw = request.args.get("lesson_id")
    lesson_id  = int(lesson_raw) if lesson_raw is not None else None
    return jsonify({"success": True, "data": svc.list_questions(g.user["user_id"], q, page, limit, lesson_id=lesson_id)})


@handle_errors
def create_question():
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    data    = request.get_json() or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"success": False, "message": "Nội dung câu hỏi không được trống"}), 400
    lesson_id = data.get("lesson_id") or None
    new_id = svc.create_question(
        g.user["user_id"], content,
        data.get("explanation") or None,
        data.get("answers", []),
        lesson_id=lesson_id,
    )
    return jsonify({"success": True, "id": new_id}), 201


@handle_errors
def update_question(question_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    data    = request.get_json() or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"success": False, "message": "Nội dung câu hỏi không được trống"}), 400
    lesson_id = data.get("lesson_id") or None
    svc.update_question(
        question_id, g.user["user_id"], content,
        data.get("explanation") or None,
        data.get("answers", []),
        lesson_id=lesson_id,
    )
    return jsonify({"success": True, "message": "Đã cập nhật câu hỏi"})


@handle_errors
def download_sample():
    buf = svc.generate_sample_excel()
    return send_file(
        buf,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="mau_ngan_hang_cau_hoi.xlsx",
    )


@handle_errors
def import_questions():
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    if "file" not in request.files:
        return jsonify({"success": False, "message": "Không tìm thấy file"}), 400
    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        return jsonify({"success": False, "message": "Chỉ hỗ trợ file .xlsx hoặc .xls"}), 400
    lesson_raw = request.form.get("lesson_id")
    lesson_id  = int(lesson_raw) if lesson_raw else None
    result = svc.import_questions_from_excel(g.user["user_id"], file.read(), lesson_id=lesson_id)
    return jsonify({"success": True, "data": result})


@handle_errors
def delete_question(question_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    svc.delete_question(question_id, g.user["user_id"])
    return jsonify({"success": True, "message": "Đã xóa câu hỏi"})
