import json
from sqlalchemy import text
from extensions import db
from config import gemini_generate


def get_teacher_dashboard(teacher_id: int) -> dict:
    sql_summary = text("""
        SELECT
            (SELECT COUNT(*) FROM users u JOIN classes c ON u.class_id=c.id
             WHERE c.teacher_id=:tid AND u.role='student') AS totalStudents,
            (SELECT COUNT(*) FROM classes WHERE teacher_id=:tid)  AS totalClasses,
            (SELECT COUNT(*) FROM lessons WHERE teacher_id=:tid)  AS totalLessons,
            (SELECT COUNT(*) FROM exams e JOIN lessons l ON e.lesson_id=l.id
             WHERE l.teacher_id=:tid) AS totalExams
    """)
    summary = dict(db.session.execute(sql_summary, {"tid": teacher_id}).mappings().first())

    sql_scores = text("""
        SELECT sa.student_id AS studentId, u.full_name AS studentName,
            ROUND(SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END)*10.0/NULLIF(COUNT(q.id),0),1) AS avgScore
        FROM student_answers sa
        JOIN answers a ON sa.answer_id=a.id
        JOIN questions q ON a.question_id=q.id
        JOIN exams e ON sa.exam_id=e.id
        JOIN lessons l ON e.lesson_id=l.id
        JOIN users u ON u.id=sa.student_id
        WHERE l.teacher_id=:tid GROUP BY sa.student_id ORDER BY avgScore DESC
    """)
    scores = [dict(r) for r in db.session.execute(sql_scores, {"tid": teacher_id}).mappings()]

    dist = {"0-4": 0, "4-6": 0, "6-8": 0, "8-10": 0}
    pass_count = fail_count = 0
    for s in scores:
        v = float(s["avgScore"] or 0)
        if v < 4:   dist["0-4"] += 1; fail_count += 1
        elif v < 6: dist["4-6"] += 1; fail_count += 1
        elif v < 8: dist["6-8"] += 1; pass_count += 1
        else:       dist["8-10"] += 1; pass_count += 1

    sql_class_avg = text("""
        SELECT c.class_name AS className,
            ROUND(AVG(t.student_avg), 2) AS avgScore
        FROM classes c
        LEFT JOIN users u ON u.class_id=c.id AND u.role='student'
        LEFT JOIN (
            SELECT sa.student_id,
                SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END)*10.0/NULLIF(COUNT(q.id),0) AS student_avg
            FROM student_answers sa
            JOIN answers a ON sa.answer_id=a.id
            JOIN questions q ON a.question_id=q.id
            GROUP BY sa.student_id
        ) t ON t.student_id=u.id
        WHERE c.teacher_id=:tid
        GROUP BY c.id, c.class_name
        ORDER BY avgScore DESC
    """)
    class_avgs = [dict(r) for r in db.session.execute(sql_class_avg, {"tid": teacher_id}).mappings()]
    for r in class_avgs:
        r["avgScore"] = float(r["avgScore"]) if r["avgScore"] is not None else None

    return {
        "summary":           summary,
        "scoreDistribution": dist,
        "passRate":          {"pass": pass_count, "fail": fail_count},
        "topStudents":       scores[:5],
        "classAvgScores":    class_avgs,
    }


def get_ai_advice(avg: float, total_students: int, dist: dict) -> list:
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
        advice = json.loads(gemini_generate(prompt).strip())
        if isinstance(advice, list):
            return advice
    except Exception:
        pass
    return [
        {"title": "Củng cố kiến thức nền",   "detail": "Dành thời gian ôn lại các phép tính cơ bản cho nhóm học sinh yếu."},
        {"title": "Tăng hoạt động thực hành", "detail": "Lồng ghép trò chơi toán học để tăng hứng thú học tập."},
        {"title": "Phân hóa bài tập",         "detail": "Giao bài theo mức độ để học sinh khá giỏi và trung bình đều tiến bộ."},
    ]
