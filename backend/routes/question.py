from flask import Blueprint
from utils import require_auth
import controllers.question_controller as ctrl

question_bp = Blueprint("question", __name__)

question_bp.add_url_rule("/api/questions/generate",     view_func=require_auth(ctrl.generate_questions), methods=["POST"])
question_bp.add_url_rule("/api/questions/import-excel", view_func=require_auth(ctrl.import_questions),   methods=["POST"])
