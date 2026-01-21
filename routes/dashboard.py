import json
import re
import pandas as pd
from datetime import datetime
from flask import Blueprint, request, jsonify, session
from utils import get_db, clean_json_string  # Import helpers
from config import gemini_generate  # Import AI model

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
    d = request.json or {}

    avg = d.get("avg", 0)
    total_students = d.get("totalStudents", 0)
    dist = d.get("dist", {})

    prompt = f"""
Bạn là trợ lý giáo dục chuyên về Toán lớp 3.

Dữ liệu lớp học:
- Điểm trung bình của lớp: {avg}
- Tổng số học sinh: {total_students}
- Phân bố điểm:
  + 0–4: {dist.get("0-4", 0)}
  + 4–6: {dist.get("4-6", 0)}
  + 6–8: {dist.get("6-8", 0)}
  + 8–10: {dist.get("8-10", 0)}

Nhiệm vụ:
- Đưa ra CHÍNH XÁC 3 lời khuyên
- Ngắn gọn, thực tế, phù hợp giáo viên Toán lớp 3

QUY ĐỊNH BẮT BUỘC:
- Chỉ trả về MỘT MẢNG JSON THUẦN
- KHÔNG markdown
- KHÔNG giải thích
- KHÔNG ký tự thừa

Định dạng:
[
  {{
    "title": "Tiêu đề ngắn",
    "detail": "Nội dung lời khuyên"
  }}
]
"""

    try:
        res = gemini_generate(prompt)
        raw_text = res.strip()

        print("Gemini raw:", raw_text)

        # Parse trực tiếp – nếu fail thì fallback
        advice_list = json.loads(raw_text)

        # Đảm bảo luôn là list
        if not isinstance(advice_list, list):
            raise ValueError("Gemini did not return a JSON array")

        return jsonify({"advice": advice_list})

    except Exception as e:
        print("Gemini error:", str(e))

        fallback = [
            {
                "title": "Củng cố kiến thức nền",
                "detail": "Dành thời gian ôn lại các phép tính cơ bản cho nhóm học sinh yếu.",
            },
            {
                "title": "Tăng hoạt động thực hành",
                "detail": "Lồng ghép trò chơi toán học để tăng hứng thú học tập.",
            },
            {
                "title": "Phân hóa bài tập",
                "detail": "Giao bài theo mức độ để học sinh khá giỏi và trung bình đều tiến bộ.",
            },
        ]
        return jsonify({"advice": fallback})


@dashboard_bp.route("/api/teacher/dashboard")
def teacher_dashboard():
    teacher_id = session.get("user_id")
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    # =========================
    # 1. SUMMARY
    # =========================
    cur.execute(
        """
        SELECT
            (SELECT COUNT(*) FROM students WHERE teacher_id = %s) AS totalStudents,
            (SELECT COUNT(*) FROM classes WHERE teacher_id = %s) AS totalClasses,
            (SELECT COUNT(*) FROM lessons WHERE teacher_id = %s) AS totalLessons,
            (
                SELECT COUNT(*)
                FROM exams e
                JOIN lessons l ON e.lesson_id = l.id
                WHERE l.teacher_id = %s
            ) AS totalExams
        """,
        (teacher_id, teacher_id, teacher_id, teacher_id),
    )
    summary = cur.fetchone()

    # =========================
    # 2. ĐIỂM TRUNG BÌNH MỖI HỌC SINH
    # =========================
    cur.execute(
        """
        SELECT
            sa.user_id AS studentId,
            SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END) * 10.0
            / COUNT(q.id) AS avgScore
        FROM student_answer sa
        JOIN answers a ON sa.answer_id = a.id
        JOIN questions q ON a.questionId = q.id
        JOIN exams e ON sa.exam_id = e.id
        JOIN lessons l ON e.lesson_id = l.id
        WHERE l.teacher_id = %s
        GROUP BY sa.user_id
        """,
        (teacher_id,),
    )
    scores = cur.fetchall()

    # =========================
    # 3. PHÂN BỐ ĐIỂM
    # =========================
    score_distribution = {
        "0-4": 0,
        "4-6": 0,
        "6-8": 0,
        "8-10": 0,
    }

    pass_count = 0
    fail_count = 0

    for s in scores:
        score = s["avgScore"]
        if score < 4:
            score_distribution["0-4"] += 1
            fail_count += 1
        elif score < 6:
            score_distribution["4-6"] += 1
            fail_count += 1
        elif score < 8:
            score_distribution["6-8"] += 1
            pass_count += 1
        else:
            score_distribution["8-10"] += 1
            pass_count += 1

    # =========================
    # 4. TOP HỌC SINH
    # =========================
    cur.execute(
        """
        SELECT
            sa.user_id AS studentId,
            SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END) * 10.0
            / COUNT(q.id) AS avgScore
        FROM student_answer sa
        JOIN answers a ON sa.answer_id = a.id
        JOIN questions q ON a.questionId = q.id
        JOIN exams e ON sa.exam_id = e.id
        JOIN lessons l ON e.lesson_id = l.id
        WHERE l.teacher_id = %s
        GROUP BY sa.user_id
        ORDER BY avgScore DESC
        LIMIT 5
        """,
        (teacher_id,),
    )
    top_students = cur.fetchall()

    conn.close()

    # =========================
    # RESPONSE
    # =========================
    return jsonify(
        {
            "summary": summary,
            "scoreDistribution": score_distribution,
            "passRate": {
                "pass": pass_count,
                "fail": fail_count,
            },
            "topStudents": top_students,
        }
    )
