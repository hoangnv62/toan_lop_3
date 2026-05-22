from flask import Blueprint
from utils import require_auth
import controllers.student_controller as ctrl

student_bp = Blueprint("student", __name__)

student_bp.add_url_rule("/api/students/search",                                          view_func=require_auth(ctrl.search_students),     methods=["GET"])
student_bp.add_url_rule("/api/students/<int:student_id>/results",                        view_func=require_auth(ctrl.get_student_results), methods=["GET"])
student_bp.add_url_rule("/api/students/<int:student_id>/progress",                       view_func=require_auth(ctrl.get_student_progress),methods=["GET"])
student_bp.add_url_rule("/api/dashboard/student",                                        view_func=require_auth(ctrl.student_dashboard),   methods=["GET"])
student_bp.add_url_rule("/api/classes/<int:class_id>/students",                          view_func=require_auth(ctrl.add_to_class),        methods=["POST"])
student_bp.add_url_rule("/api/classes/<int:class_id>/students/upload",                   view_func=require_auth(ctrl.upload_students),     methods=["POST"])
student_bp.add_url_rule("/api/classes/<int:class_id>/students/<int:student_id>",         view_func=require_auth(ctrl.remove_from_class),   methods=["DELETE"])
