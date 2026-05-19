import json
from flask import Blueprint, request, jsonify
from utils import clean_json_string, require_auth
from config import gemini_generate

question_bp = Blueprint("question", __name__)


@question_bp.route("/api/questions/generate", methods=["POST"])
@require_auth
def generate_questions():
    d = request.json or {}
    prompt = f"""
    Bạn là giáo viên Toán lớp 3. Hãy tạo {d.get("numQuestions", 5)} câu hỏi trắc nghiệm về chủ đề '{d.get("lessonTitle", "")}'. {d.get("examDescription", "")}
    Mỗi câu hỏi có đúng 4 đáp án, trong đó chỉ 1 đáp án đúng.
    Trả về JSON Array theo đúng format sau, không giải thích thêm:
    [
      {{
        "questionContent": "Nội dung câu hỏi",
        "explanation": "Giải thích đáp án đúng",
        "answers": [
          {{"content": "Đáp án A", "isCorrected": 1}},
          {{"content": "Đáp án B", "isCorrected": 0}},
          {{"content": "Đáp án C", "isCorrected": 0}},
          {{"content": "Đáp án D", "isCorrected": 0}}
        ]
      }}
    ]
    Lưu ý: isCorrected là 1 nếu đúng, 0 nếu sai. Chỉ đúng 1 đáp án mỗi câu.
    """
    try:
        data = json.loads(clean_json_string(gemini_generate(prompt)))
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
