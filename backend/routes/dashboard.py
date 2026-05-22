from flask import Blueprint
from utils import require_auth
import controllers.dashboard_controller as ctrl

dashboard_bp = Blueprint("dashboard", __name__)

dashboard_bp.add_url_rule("/api/dashboard/teacher", view_func=require_auth(ctrl.teacher_dashboard), methods=["GET"])
dashboard_bp.add_url_rule("/api/dashboard/advice",  view_func=require_auth(ctrl.get_ai_advice),     methods=["POST"])
