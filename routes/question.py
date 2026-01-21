from flask import Blueprint, render_template, request, jsonify, session
from utils import get_db, clean_json_string  # Import helper
import json
from config import gemini_generate

question_bp = Blueprint("question", __name__)


@question_bp.route("/api/questions/generate", methods=["POST"])
def generate_exam():
    d = request.json
    num_questions = d["numQuestions"]
    lesson_title = d["lessonTitle"]
    exam_description = d["examDescription"]
    prompt = f"""
    Giáo viên Toán lớp 3. Tạo {num_questions} câu trắc nghiệm '{lesson_title}'. {exam_description}
    Format JSON Array: [
    {{ 
        "questionContent": "...", 
        "explanation": "...",
        "answers": [
            {{
                "content": "...",
                "isCorrected": 1/0
            }}
        ]
    }}]
    """
    try:
        res = gemini_generate(prompt)
        return jsonify(
            {"status": "success", "data": json.loads(clean_json_string(res))}
        )
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})
