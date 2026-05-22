from flask import Blueprint
from utils import require_auth
import controllers.exam_controller as ctrl

exam_bp = Blueprint("exam", __name__)

exam_bp.add_url_rule("/api/exams/<int:exam_id>",                                      view_func=require_auth(ctrl.get_exam),               methods=["GET"])
exam_bp.add_url_rule("/api/exams/<int:exam_id>",                                      view_func=require_auth(ctrl.delete_exam),             methods=["DELETE"])
exam_bp.add_url_rule("/api/exams/<int:exam_id>/assignments",                          view_func=require_auth(ctrl.get_exam_assignments),    methods=["GET"])
exam_bp.add_url_rule("/api/exams/<int:exam_id>/clone",                                view_func=require_auth(ctrl.clone_exam),              methods=["POST"])
exam_bp.add_url_rule("/api/exams/<int:exam_id>/submit",                               view_func=require_auth(ctrl.submit_exam),             methods=["POST"])
exam_bp.add_url_rule("/api/exams/<int:exam_id>/result",                               view_func=require_auth(ctrl.get_exam_result),         methods=["GET"])
exam_bp.add_url_rule("/api/exams/<int:exam_id>/stats",                                view_func=require_auth(ctrl.get_exam_stats),          methods=["GET"])
exam_bp.add_url_rule("/api/exams/<int:exam_id>/export",                               view_func=require_auth(ctrl.export_exam_results),     methods=["GET"])
exam_bp.add_url_rule("/api/exams/<int:exam_id>/submissions/<int:student_id>",         view_func=require_auth(ctrl.get_student_submission),  methods=["GET"])
exam_bp.add_url_rule("/api/exams/<int:exam_id>/submissions/<int:student_id>/comment", view_func=require_auth(ctrl.save_comment),            methods=["POST"])
exam_bp.add_url_rule("/api/lessons/<int:lesson_id>/exams",                            view_func=require_auth(ctrl.create_exam),             methods=["POST"])
exam_bp.add_url_rule("/api/lessons/<int:lesson_id>/exams/<int:exam_id>",              view_func=require_auth(ctrl.update_exam),             methods=["PUT"])
