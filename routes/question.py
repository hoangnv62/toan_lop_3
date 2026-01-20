from flask import Blueprint, render_template, request, jsonify, session
from utils import get_db, clean_json_string  # Import helper
import json
from config import model

question_bp = Blueprint("question", __name__)


@question_bp.route("/api/questions/generate", methods=["POST"])
def generate_exam():
    d = request.json
    num_questions = d["numQuestions"]
    lesson_title = d["lessonTitle"]
    exam_description = d["examDescription"]
    prompt = f"""
    Giáo viên Toán lớp 3. Tạo {num_questions} câu trắc nghiệm '{lesson_title}'. {exam_description}
    HÌNH ẢNH SVG: Dùng <circle>, <rect>... màu sắc đẹp minh họa số lượng. KHÔNG dùng Emoji.
    Format JSON Array: [
    {{ 
        "questionContent": "...", 
        "svg_code": "...", 
        "explanation": "...",
        "answers": [
            {{
                "content": "...",
                "isCorrected": true/false
            }}
        ]
    }}]
    """
    try:
        res = model.generate_content(prompt)
        return jsonify(
            {"status": "success", "data": json.loads(clean_json_string(res.text))}
        )
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})
