from flask import Blueprint
from utils import require_auth
import controllers.question_bank_controller as ctrl

question_bank_bp = Blueprint("question_bank", __name__)

question_bank_bp.add_url_rule("/api/question-bank",                      view_func=require_auth(ctrl.list_questions),   methods=["GET"])
question_bank_bp.add_url_rule("/api/question-bank",                      view_func=require_auth(ctrl.create_question),  methods=["POST"])
question_bank_bp.add_url_rule("/api/question-bank/<int:question_id>",    view_func=require_auth(ctrl.update_question),  methods=["PUT"])
question_bank_bp.add_url_rule("/api/question-bank/<int:question_id>",    view_func=require_auth(ctrl.delete_question),  methods=["DELETE"])
