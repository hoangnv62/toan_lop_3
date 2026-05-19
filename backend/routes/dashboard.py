import json
from flask import Blueprint, request, jsonify, g
from utils import get_db, require_auth
from config import gemini_generate

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard/teacher", methods=["GET"])
@require_auth
def teacher_dashboard():
    teacher_id = g.user["user_id"]
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        """
        SELECT
            (SELECT COUNT(*) FROM students WHERE teacher_id = %s) AS totalStudents,
            (SELECT COUNT(*) FROM classes WHERE teacher_id = %s) AS totalClasses,
            (SELECT COUNT(*) FROM lessons WHERE teacher_id = %s) AS totalLessons,
            (SELECT COUNT(*) FROM exams e JOIN lessons l ON e.lesson_id = l.id
             WHERE l.teacher_id = %s) AS totalExams
        """,
        (teacher_id, teacher_id, teacher_id, teacher_id),
    )
    summary = cur.fetchone()

    cur.execute(
        """
        SELECT sa.user_id AS studentId,
            ROUND(SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END) * 10.0
                  / NULLIF(COUNT(q.id), 0), 1) AS avgScore
        FROM student_answer sa
        JOIN answers a ON sa.answer_id = a.id
        JOIN questions q ON a.questionId = q.id
        JOIN exams e ON sa.exam_id = e.id
        JOIN lessons l ON e.lesson_id = l.id
        WHERE l.teacher_id = %s
        GROUP BY sa.user_id
        ORDER BY avgScore DESC
        """,
        (teacher_id,),
    )
    scores = cur.fetchall()
    cur.close()
    conn.close()

    score_distribution = {"0-4": 0, "4-6": 0, "6-8": 0, "8-10": 0}
    pass_count = fail_count = 0
    for s in scores:
        score = float(s["avgScore"] or 0)
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

    return jsonify({"success": True, "data": {
        "summary": summary,
        "scoreDistribution": score_distribution,
        "passRate": {"pass": pass_count, "fail": fail_count},
        "topStudents": scores[:5],
    }})


@dashboard_bp.route("/api/dashboard/advice", methods=["POST"])
@require_auth
def get_ai_advice():
    d = request.json or {}
    avg = d.get("avg", 0)
    total_students = d.get("totalStudents", 0)
    dist = d.get("dist", {})

    prompt = f"""
Bạn là trợ lý giáo dục chuyên về Toán lớp 3.

Dữ liệu lớp học:
- Điểm trung bình: {avg}
- Tổng số học sinh: {total_students}
- Phân bố điểm: 0–4: {dist.get("0-4",0)}, 4–6: {dist.get("4-6",0)}, 6–8: {dist.get("6-8",0)}, 8–10: {dist.get("8-10",0)}

Đưa ra CHÍNH XÁC 3 lời khuyên ngắn gọn, thực tế cho giáo viên Toán lớp 3.
Chỉ trả về JSON array thuần, không markdown, không giải thích:
[{{"title": "Tiêu đề", "detail": "Nội dung"}}]
"""

    try:
        advice_list = json.loads(gemini_generate(prompt).strip())
        if not isinstance(advice_list, list):
            raise ValueError
        return jsonify({"success": True, "data": {"advice": advice_list}})
    except Exception:
        return jsonify({"success": True, "data": {"advice": [
            {"title": "Củng cố kiến thức nền", "detail": "Dành thời gian ôn lại các phép tính cơ bản cho nhóm học sinh yếu."},
            {"title": "Tăng hoạt động thực hành", "detail": "Lồng ghép trò chơi toán học để tăng hứng thú học tập."},
            {"title": "Phân hóa bài tập", "detail": "Giao bài theo mức độ để học sinh khá giỏi và trung bình đều tiến bộ."},
        ]}})
