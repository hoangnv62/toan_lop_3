from flask import Blueprint
from utils import require_auth
import controllers.relative_controller as ctrl

relatives_bp = Blueprint("relatives", __name__)

relatives_bp.add_url_rule("/api/students/<int:student_id>/relatives", view_func=require_auth(ctrl.get_relatives), methods=["GET"])
relatives_bp.add_url_rule("/api/students/<int:student_id>/relatives", view_func=require_auth(ctrl.add_relative),  methods=["POST"])
relatives_bp.add_url_rule("/api/relatives/<int:relative_id>",         view_func=require_auth(ctrl.update_relative), methods=["PUT"])
relatives_bp.add_url_rule("/api/relatives/<int:relative_id>",         view_func=require_auth(ctrl.delete_relative), methods=["DELETE"])
