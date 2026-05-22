from flask import Blueprint
from utils import require_auth
import controllers.lesson_controller as ctrl

lesson_bp = Blueprint("lesson", __name__)

lesson_bp.add_url_rule("/api/lessons",                   view_func=require_auth(ctrl.get_lessons),   methods=["GET"])
lesson_bp.add_url_rule("/api/lessons",                   view_func=require_auth(ctrl.create_lesson), methods=["POST"])
lesson_bp.add_url_rule("/api/lessons/<int:lesson_id>",   view_func=require_auth(ctrl.get_lesson),    methods=["GET"])
lesson_bp.add_url_rule("/api/lessons/<int:lesson_id>",   view_func=require_auth(ctrl.update_lesson), methods=["PUT"])
lesson_bp.add_url_rule("/api/lessons/<int:lesson_id>",   view_func=require_auth(ctrl.delete_lesson), methods=["DELETE"])
