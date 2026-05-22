from datetime import datetime
from flask import request, jsonify, g
from controllers import handle_errors
import services.class_service as svc


def _parse_dt(s):
    if not s:
        return None
    for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None


@handle_errors
def get_teacher_classes():
    return jsonify({"success": True, "data": svc.get_teacher_classes(g.user["user_id"])})


@handle_errors
def get_class_detail(class_id):
    return jsonify({"success": True, "data": svc.get_class_detail(class_id)})


@handle_errors
def add_class():
    class_name = (request.json or {}).get("class_name", "").strip()
    if not class_name:
        return jsonify({"success": False, "message": "Tên lớp không được trống"}), 400
    svc.add_class(g.user["user_id"], class_name)
    return jsonify({"success": True, "message": f'Tạo lớp "{class_name}" thành công'})


@handle_errors
def update_class(class_id):
    new_name = (request.json or {}).get("className", "").strip()
    if not new_name:
        return jsonify({"success": False, "message": "Tên lớp không được trống"}), 400
    svc.update_class(class_id, g.user["user_id"], new_name)
    return jsonify({"success": True, "message": "Cập nhật thành công"})


@handle_errors
def delete_class(class_id):
    svc.delete_class(class_id, g.user["user_id"])
    return jsonify({"success": True, "message": "Đã xóa lớp"})


@handle_errors
def get_class_exams(class_id):
    return jsonify({"success": True, "data": svc.get_class_exams(class_id, g.user["user_id"])})


@handle_errors
def assign_exam(class_id):
    data       = request.get_json() or {}
    exam_id    = data.get("exam_id")
    time_limit = data.get("time_limit")
    deadline   = _parse_dt(data.get("deadline"))
    open_time  = _parse_dt(data.get("open_time"))
    if not exam_id:
        return jsonify({"success": False, "message": "Thiếu exam_id"}), 400
    if not time_limit or not deadline or not open_time:
        return jsonify({"success": False, "message": "Thời gian làm bài, thời gian mở đề và hạn nộp bài không được để trống"}), 400
    try:
        time_limit = int(time_limit)
        if time_limit <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Thời gian làm bài không hợp lệ"}), 400
    svc.assign_exam(class_id, g.user["user_id"], exam_id, deadline, open_time, time_limit)
    return jsonify({"success": True, "message": "Đã giao bài cho lớp"})


@handle_errors
def update_exam_assignment(class_id, exam_id):
    data       = request.get_json() or {}
    time_limit = data.get("time_limit")
    deadline   = _parse_dt(data.get("deadline"))
    open_time  = _parse_dt(data.get("open_time"))
    if not time_limit or not deadline or not open_time:
        return jsonify({"success": False, "message": "Thời gian làm bài, thời gian mở đề và hạn nộp bài không được để trống"}), 400
    try:
        time_limit = int(time_limit)
        if time_limit <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Thời gian làm bài không hợp lệ"}), 400
    svc.update_assignment(class_id, g.user["user_id"], exam_id, deadline, open_time, time_limit)
    return jsonify({"success": True, "message": "Đã cập nhật hạn nộp"})


@handle_errors
def unassign_exam(class_id, exam_id):
    svc.unassign_exam(class_id, g.user["user_id"], exam_id)
    return jsonify({"success": True, "message": "Đã thu hồi bài thi"})


@handle_errors
def get_students_with_scores(class_id):
    return jsonify({"success": True, "data": svc.get_students_with_scores(class_id)})


@handle_errors
def get_announcements(class_id):
    return jsonify({"success": True, "data": svc.get_announcements(class_id)})


@handle_errors
def create_announcement(class_id):
    data    = request.get_json() or {}
    title   = data.get("title", "").strip()
    content = data.get("content", "").strip()
    if not title or not content:
        return jsonify({"success": False, "message": "Tiêu đề và nội dung không được trống"}), 400
    new_id = svc.create_announcement(class_id, g.user["user_id"], title, content)
    return jsonify({"success": True, "id": new_id}), 201


@handle_errors
def delete_announcement(ann_id):
    svc.delete_announcement(ann_id, g.user["user_id"])
    return jsonify({"success": True, "message": "Đã xóa thông báo"})


@handle_errors
def export_students(class_id):
    import openpyxl
    from io import BytesIO
    from urllib.parse import quote
    from flask import Response
    class_name, students = svc.get_students_for_export(class_id, g.user["user_id"])
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Danh sách học sinh"
    ws.append(["STT", "Họ và tên", "Username", "Ngày sinh", "Điểm TB", "Số bài đã làm"])
    for i, s in enumerate(students, 1):
        ws.append([i, s["full_name"], s["username"], str(s["dob"]) if s.get("dob") else "",
                   float(s["avg_score"] or 0), int(s["total_exams"] or 0)])
    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(
        buf.getvalue(),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(class_name)}.xlsx"},
    )
