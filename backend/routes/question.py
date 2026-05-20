import json
import pandas as pd
from io import BytesIO
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


@question_bp.route("/api/questions/import-excel", methods=["POST"])
@require_auth
def import_questions():
    if "file" not in request.files:
        return jsonify({"success": False, "message": "Không tìm thấy file"}), 400
    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        return jsonify({"success": False, "message": "Chỉ hỗ trợ file .xlsx hoặc .xls"}), 400
    try:
        df = pd.read_excel(BytesIO(file.read()))
        df.columns = df.columns.str.strip().str.lower()
        required = ["câu hỏi", "đáp án a", "đáp án b", "đáp án c", "đáp án d", "đáp án đúng"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            return jsonify({"success": False, "message": f"File thiếu cột: {', '.join(missing)}"}), 400

        questions = []
        errors    = []
        label_map = {"a": 0, "b": 1, "c": 2, "d": 3}

        for i, row in df.iterrows():
            content = str(row["câu hỏi"]).strip()
            if not content or content == "nan":
                continue
            correct_label = str(row["đáp án đúng"]).strip().lower()
            if correct_label not in label_map:
                errors.append(f"Dòng {i + 2}: đáp án đúng phải là a/b/c/d")
                continue
            correct_idx = label_map[correct_label]
            answers_raw = [
                str(row["đáp án a"]).strip(),
                str(row["đáp án b"]).strip(),
                str(row["đáp án c"]).strip(),
                str(row["đáp án d"]).strip(),
            ]
            explanation = str(row.get("giải thích", "")).strip()
            if explanation == "nan":
                explanation = ""
            questions.append({
                "questionContent": content,
                "explanation":     explanation,
                "answers": [
                    {"content": c, "isCorrected": 1 if j == correct_idx else 0}
                    for j, c in enumerate(answers_raw)
                ],
            })

        return jsonify({"success": True, "data": questions, "errors": errors})
    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi xử lý file: {str(e)}"}), 500
