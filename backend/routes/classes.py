from flask import Blueprint
from utils import require_auth
import controllers.class_controller as ctrl

classes_bp = Blueprint("classes", __name__)

classes_bp.add_url_rule("/api/classes",                                        view_func=require_auth(ctrl.get_teacher_classes),    methods=["GET"])
classes_bp.add_url_rule("/api/classes",                                        view_func=require_auth(ctrl.add_class),              methods=["POST"])
classes_bp.add_url_rule("/api/classes/<int:class_id>",                         view_func=require_auth(ctrl.get_class_detail),       methods=["GET"])
classes_bp.add_url_rule("/api/classes/<int:class_id>",                         view_func=require_auth(ctrl.update_class),           methods=["PUT"])
classes_bp.add_url_rule("/api/classes/<int:class_id>",                         view_func=require_auth(ctrl.delete_class),           methods=["DELETE"])
classes_bp.add_url_rule("/api/classes/<int:class_id>/exams",                   view_func=require_auth(ctrl.get_class_exams),        methods=["GET"])
classes_bp.add_url_rule("/api/classes/<int:class_id>/exams",                   view_func=require_auth(ctrl.assign_exam),            methods=["POST"])
classes_bp.add_url_rule("/api/classes/<int:class_id>/exams/<int:exam_id>",     view_func=require_auth(ctrl.update_exam_assignment), methods=["PUT"])
classes_bp.add_url_rule("/api/classes/<int:class_id>/exams/<int:exam_id>",     view_func=require_auth(ctrl.unassign_exam),          methods=["DELETE"])
classes_bp.add_url_rule("/api/classes/<int:class_id>/students",                view_func=require_auth(ctrl.get_students_with_scores), methods=["GET"])
classes_bp.add_url_rule("/api/classes/<int:class_id>/students/export",         view_func=require_auth(ctrl.export_students),        methods=["GET"])
classes_bp.add_url_rule("/api/classes/<int:class_id>/announcements",           view_func=require_auth(ctrl.get_announcements),      methods=["GET"])
classes_bp.add_url_rule("/api/classes/<int:class_id>/announcements",           view_func=require_auth(ctrl.create_announcement),    methods=["POST"])
classes_bp.add_url_rule("/api/announcements/<int:ann_id>",                     view_func=require_auth(ctrl.delete_announcement),    methods=["DELETE"])
