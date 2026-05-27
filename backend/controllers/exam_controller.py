from flask import request, jsonify, g
from controllers import handle_errors
import services.exam_service as svc


@handle_errors
def get_exam(exam_id):
    student_id = g.user["user_id"] if g.user["role"] == "student" else None
    return jsonify({"success": True, "data": svc.get_exam(exam_id, student_id)})


@handle_errors
def get_exam_assignments(exam_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    return jsonify({"success": True, "data": svc.get_assignments(exam_id, g.user["user_id"])})


@handle_errors
def create_exam(lesson_id):
    data    = request.get_json() or {}
    exam_id = svc.create_exam(lesson_id, data.get("name"), data.get("description"), data.get("questions", []))
    return jsonify({"success": True, "message": "Tạo bài kiểm tra thành công", "examId": exam_id})


@handle_errors
def update_exam(lesson_id, exam_id):
    data = request.get_json() or {}
    svc.update_exam(exam_id, lesson_id, data.get("name"), data.get("description"), data.get("questions", []))
    return jsonify({"success": True, "message": "Cập nhật bài kiểm tra thành công"})


@handle_errors
def delete_exam(exam_id):
    svc.delete_exam(exam_id)
    return jsonify({"success": True, "message": "Đã xóa  bài tập"})


@handle_errors
def clone_exam(exam_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    new_id = svc.clone_exam(exam_id)
    return jsonify({"success": True, "message": "Đã sao chép  bài tập", "examId": new_id})


@handle_errors
def submit_exam(exam_id):
    data       = request.get_json() or {}
    answers    = data.get("answers", [])
    time_spent = data.get("timeSpent", 0)
    if not answers:
        return jsonify({"success": False, "message": "Thiếu dữ liệu câu trả lời"}), 400
    result = svc.submit_exam(exam_id, g.user["user_id"], answers, time_spent)
    return jsonify({"success": True, "data": result})


@handle_errors
def get_exam_result(exam_id):
    return jsonify({"success": True, "data": svc.get_result(exam_id, g.user["user_id"])})


@handle_errors
def get_student_submission(exam_id, student_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền truy cập"}), 403
    return jsonify({"success": True, "data": svc.get_result(exam_id, student_id)})


@handle_errors
def export_exam_results(exam_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    return svc.export_results(exam_id)


@handle_errors
def export_exam_pdf(exam_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    variants = max(1, min(20, int(request.args.get("variants", 1))))
    duration = max(5, min(180, int(request.args.get("duration", 45))))
    return svc.export_pdf(exam_id, variants, duration)


@handle_errors
def ai_exam_feedback(exam_id):
    if g.user["role"] != "student":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    feedback = svc.generate_ai_feedback(exam_id, g.user["user_id"])
    return jsonify({"success": True, "data": {"feedback": feedback}})


@handle_errors
def ai_stats_analysis(exam_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    insights = svc.analyze_exam_stats(exam_id)
    return jsonify({"success": True, "data": {"insights": insights}})


@handle_errors
def get_exam_stats(exam_id):
    return jsonify({"success": True, "data": svc.get_stats(exam_id)})


@handle_errors
def save_comment(exam_id, student_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403
    comment = (request.json or {}).get("comment", "").strip()
    if not comment:
        return jsonify({"success": False, "message": "Nhận xét không được trống"}), 400
    svc.save_comment(exam_id, student_id, g.user["user_id"], comment)
    return jsonify({"success": True, "message": "Đã lưu nhận xét"})
