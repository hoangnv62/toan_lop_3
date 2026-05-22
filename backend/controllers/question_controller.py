from flask import request, jsonify
from controllers import handle_errors
import services.question_service as svc


@handle_errors
def generate_questions():
    d = request.json or {}
    data = svc.generate_questions(
        num_questions=d.get("numQuestions", 5),
        lesson_title=d.get("lessonTitle", ""),
        exam_description=d.get("examDescription", ""),
    )
    return jsonify({"success": True, "data": data})


@handle_errors
def import_questions():
    if "file" not in request.files:
        return jsonify({"success": False, "message": "Không tìm thấy file"}), 400
    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        return jsonify({"success": False, "message": "Chỉ hỗ trợ file .xlsx hoặc .xls"}), 400
    questions, errors = svc.import_from_excel(file.read())
    return jsonify({"success": True, "data": questions, "errors": errors})
