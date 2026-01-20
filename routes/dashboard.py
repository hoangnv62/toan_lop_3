import json
import re
import pandas as pd
from datetime import datetime
from flask import Blueprint, request, jsonify, session
from utils import get_db, clean_json_string  # Import helpers
from config import model  # Import AI model

dashboard_bp = Blueprint("dashboard", __name__)


# --- API BÁO CÁO TỔNG QUAN & AI ADVICE (NEW) ---
@dashboard_bp.route("/api/teacher/stats/overall", methods=["GET"])
def overall_stats():
    teacher_id = session.get("user_id")
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    sql = """
        SELECT
            COUNT(*)                                   AS total_exams_taken,
            ROUND(AVG(score10), 1)                     AS class_avg,
            SUM(CASE WHEN score10 >= 9 THEN 1 ELSE 0 END) AS excellent,
            SUM(CASE WHEN score10 BETWEEN 7 AND 8.99 THEN 1 ELSE 0 END) AS good,
            SUM(CASE WHEN score10 BETWEEN 5 AND 6.99 THEN 1 ELSE 0 END) AS average,
            SUM(CASE WHEN score10 < 5 THEN 1 ELSE 0 END) AS weak
        FROM (
            SELECT 
                sa.user_id,
                sa.exam_id,

                -- quy đổi về thang 10
                ROUND(
                    SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END)
                    / COUNT(DISTINCT q.id) * 10, 
                2) AS score10

            FROM student_answer sa
            JOIN answers a    ON sa.answer_id = a.id
            JOIN questions q  ON a.questionId = q.id
            JOIN exams e      ON sa.exam_id = e.id
            JOIN lessons l   ON e.lesson_id = l.id
            WHERE l.teacher_id = %s
            GROUP BY sa.user_id, sa.exam_id
        ) t;

    """

    cur.execute(sql, (teacher_id,))
    r = cur.fetchone()
    cur.execute(
        """
        SELECT COUNT(*) FROM students s WHERE s.teacher_id=%s
    """,
        (teacher_id,),
    )
    student_count = cur.fetchone()["COUNT(*)"]
    conn.close()

    return jsonify(
        {
            "student_count": student_count,
            "total_exams_taken": r["total_exams_taken"],
            "class_avg": float(r["class_avg"] or 0),
            "distribution": [
                int(r["excellent"]),
                int(r["good"]),
                int(r["average"]),
                int(r["weak"]),
            ],
        }
    )


# API LỜI KHUYÊN TỪ AI
@dashboard_bp.route("/api/teacher/get-advice", methods=["POST"])
def get_ai_advice():
    d = request.json

    prompt = f"""
                Bạn là trợ lý giáo dục chuyên về Toán lớp 3. Dựa trên thống kê lớp học:
                - Điểm trung bình: {d.get('avg', 0)}
                - Số bài làm: {d.get('total', 0)}
                - Phân bố (Giỏi/Khá/TB/Yếu): {d.get('dist', [0,0,0,0])}
                    
                Hãy đưa ra đúng **3 lời khuyên** ngắn gọn, thiết thực cho giáo viên để cải thiện chất lượng dạy học.
                **QUAN TRỌNG**: Chỉ trả về MẢNG JSON thuần túy, KHÔNG thêm bất kỳ ký tự nào khác (không có ```json
                [{{
                    "title": "Tiêu đề ngắn gọn",
                    "detail": "Nội dung chi tiết lời khuyên"
                }}, ...]
                """

    try:
        res = model.generate_content(prompt)
        raw_text = res.text.strip()

        print("Gemini raw response:", raw_text)  # Debug để xem chính xác Gemini trả gì

        # Làm sạch: loại bỏ ```json, ``` và các ký tự thừa
        cleaned_text = re.sub(
            r"^```json\s*|\s*```$", "", raw_text, flags=re.IGNORECASE | re.MULTILINE
        ).strip()
        cleaned_text = re.sub(
            r"^\s*\[|\]\s*$", "", cleaned_text
        ).strip()  # loại bỏ [ ] nếu thừa

        # Parse thành list JSON
        try:
            advice_list = json.loads(f"[{cleaned_text}]")
        except json.JSONDecodeError:
            # Nếu parse lỗi, thử parse trực tiếp (trường hợp Gemini trả mảng mà không có dấu ngoặc ngoài)
            advice_list = json.loads(cleaned_text)

        print("Cleaned advice list:", advice_list)
        return jsonify({"advice": advice_list})  # Trả về array JSON trực tiếp

    except Exception as e:
        print("Lỗi khi gọi Gemini:", str(e))
        # Fallback an toàn
        fallback = [
            {
                "title": "Tăng cường luyện tập cơ bản",
                "detail": "Tổ chức các bài tập ngắn hàng ngày để củng cố kiến thức nền.",
            },
            {
                "title": "Sử dụng phương pháp trực quan",
                "detail": "Dùng hình ảnh, mô hình, trò chơi để minh họa bài học cho học sinh lớp 3.",
            },
            {
                "title": "Phụ đạo cá nhân hóa",
                "detail": "Theo dõi và hỗ trợ riêng cho các em yếu để nâng cao kết quả chung.",
            },
        ]
        return jsonify({"advice": fallback})
