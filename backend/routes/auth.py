from flask import Blueprint
from utils import require_auth
import controllers.auth_controller as ctrl

auth_bp = Blueprint("auth", __name__)

auth_bp.add_url_rule("/api/auth/register/teacher", view_func=ctrl.register_teacher, methods=["POST"])
auth_bp.add_url_rule("/api/auth/register/student", view_func=ctrl.register_student, methods=["POST"])
auth_bp.add_url_rule("/api/auth/login/teacher",    view_func=ctrl.login_teacher,    methods=["POST"])
auth_bp.add_url_rule("/api/auth/login/student",    view_func=ctrl.login_student,    methods=["POST"])
auth_bp.add_url_rule("/api/auth/logout",           view_func=ctrl.logout,           methods=["POST"])
auth_bp.add_url_rule("/api/auth/me",               view_func=require_auth(ctrl.me), methods=["GET"])
auth_bp.add_url_rule("/api/auth/profile",          view_func=require_auth(ctrl.update_profile),  methods=["PUT"])
auth_bp.add_url_rule("/api/auth/password",         view_func=require_auth(ctrl.change_password), methods=["PUT"])
