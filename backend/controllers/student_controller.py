from datetime import datetime
from flask import request, jsonify, g
from controllers import handle_errors
import services.student_service as svc


def _parse_date(s):
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None


@handle_errors
def search_students():
    q        = request.args.get("q", "").strip()
    class_id = request.args.get("class_id", type=int)
    if not q:
        return jsonify({"success": True, "data": []})
    return jsonify({"success": True, "data": svc.search_students(q, class_id)})


@handle_errors
def add_to_class(class_id):
    username = (request.json or {}).get("username", "").strip()
    if not username:
        return jsonify({"success": False, "message": "Thiếu username học sinh"}), 400
    full_name = svc.add_to_class(class_id, g.user["user_id"], username)
    return jsonify({"success": True, "message": f"Đã thêm {full_name} vào lớp"})


@handle_errors
def upload_students(class_id):
    if "file" not in request.files:
        return jsonify({"success": False, "message": "Không tìm thấy file"}), 400
    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        return jsonify({"success": False, "message": "Chỉ hỗ trợ file .xlsx hoặc .xls"}), 400
    result = svc.upload_students(class_id, g.user["user_id"], file.read())
    msg = f"Thêm thành công {result['count']} học sinh."
    if result["errors"]:
        msg += f" Có {len(result['errors'])} lỗi: " + "; ".join(result["errors"][:3])
    return jsonify({"success": True, "message": msg, "count": result["count"]})


@handle_errors
def remove_from_class(class_id, student_id):
    svc.remove_from_class(class_id, g.user["user_id"], student_id)
    return jsonify({"success": True, "message": "Đã gỡ học sinh khỏi lớp"})


@handle_errors
def get_student_results(student_id):
    return jsonify({"success": True, "data": svc.get_student_results(student_id)})


@handle_errors
def get_student_progress(student_id):
    return jsonify({"success": True, "data": svc.get_student_progress(student_id)})


@handle_errors
def student_dashboard():
    uid       = g.user["user_id"]
    show_all  = request.args.get("all") == "true"
    date_from = _parse_date(request.args.get("dateFrom", ""))
    date_to   = _parse_date(request.args.get("dateTo", ""))
    if not show_all and date_from and date_to and date_from > date_to:
        return jsonify({"success": False, "message": "dateFrom phải nhỏ hơn hoặc bằng dateTo"}), 400
    return jsonify({"success": True, "data": svc.get_student_dashboard(uid, show_all, date_from, date_to)})
