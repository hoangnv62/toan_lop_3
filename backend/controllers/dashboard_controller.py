from flask import request, jsonify, g
from controllers import handle_errors
import services.dashboard_service as svc


@handle_errors
def teacher_dashboard():
    return jsonify({"success": True, "data": svc.get_teacher_dashboard(g.user["user_id"])})


@handle_errors
def get_ai_advice():
    d   = request.json or {}
    return jsonify({"success": True, "data": {"advice": svc.get_ai_advice(
        avg=d.get("avg", 0),
        total_students=d.get("totalStudents", 0),
        dist=d.get("dist", {}),
    )}})
