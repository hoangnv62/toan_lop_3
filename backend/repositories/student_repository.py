from datetime import timedelta
from sqlalchemy import text
from extensions import db
from models.user import User


class StudentRepository:
    def find_by_id(self, student_id: int) -> User | None:
        return db.session.execute(
            db.select(User).where(User.id == student_id, User.role == "student")
        ).scalar_one_or_none()

    def add_to_class(self, student: User, class_id: int) -> None:
        student.class_id = class_id

    def remove_from_class(self, student: User) -> None:
        student.class_id = None

    def get_results(self, student_id: int) -> list[dict]:
        sql = text("""
            SELECT e.id AS examId, e.name AS examName, l.title AS lessonName,
                ROUND(SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END)/NULLIF(COUNT(DISTINCT q.id),0)*10,1) AS score,
                MAX(sa.submitted_at) AS submittedAt
            FROM student_answers sa
            JOIN answers a ON sa.answer_id=a.id
            JOIN questions q ON a.question_id=q.id
            JOIN exams e ON sa.exam_id=e.id
            JOIN lessons l ON e.lesson_id=l.id
            WHERE sa.student_id=:sid
            GROUP BY sa.exam_id ORDER BY MAX(sa.submitted_at) DESC
        """)
        rows = db.session.execute(sql, {"sid": student_id}).mappings().all()
        return [dict(r) for r in rows]

    def get_progress(self, student_id: int) -> list[dict]:
        sql = text("""
            SELECT e.name AS examName,
                ROUND(SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END)/NULLIF(COUNT(DISTINCT q.id),0)*10,1) AS score,
                MAX(sa.submitted_at) AS submittedAt
            FROM student_answers sa
            JOIN answers a ON sa.answer_id=a.id
            JOIN questions q ON a.question_id=q.id
            JOIN exams e ON sa.exam_id=e.id
            WHERE sa.student_id=:sid
            GROUP BY sa.exam_id ORDER BY MAX(sa.submitted_at) ASC
        """)
        rows = db.session.execute(sql, {"sid": student_id}).mappings().all()
        return [dict(r) for r in rows]

    def get_lessons_with_stats(self, student_id: int, date_from=None, date_to=None) -> list[dict]:
        sql = """
            SELECT l.id AS lesson_id, l.title AS lesson_name, l.created_at,
                e.id AS exam_id, e.name AS exam_name, e.date_created AS exam_created_at, ce.deadline, ce.open_time,
                CASE WHEN MAX(sa.id) IS NULL THEN 0 ELSE 1 END AS done,
                COUNT(DISTINCT q.id) AS total_questions,
                SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct_questions,
                MAX(sa.time_spent) AS time_spent
            FROM lessons l
            JOIN exams e ON e.lesson_id=l.id
            JOIN class_exams ce ON ce.exam_id=e.id
            LEFT JOIN student_answers sa ON sa.exam_id=e.id AND sa.student_id=:sid
            LEFT JOIN answers a ON sa.answer_id=a.id
            LEFT JOIN questions q ON a.question_id=q.id
            WHERE ce.class_id=(SELECT class_id FROM users WHERE id=:sid)
              AND (ce.open_time IS NULL OR ce.open_time <= NOW())
        """
        params: dict = {"sid": student_id}
        if date_from:
            sql += " AND (sa.submitted_at >= :df OR sa.submitted_at IS NULL)"
            params["df"] = date_from
        if date_to:
            sql += " AND (sa.submitted_at < :dt OR (sa.submitted_at IS NULL AND ce.assigned_at < :dt2))"
            params["dt"]  = date_to + timedelta(days=1)
            params["dt2"] = date_to + timedelta(days=1)
        sql += " GROUP BY l.id, e.id ORDER BY l.created_at DESC"
        rows = db.session.execute(text(sql), params).mappings().all()
        return [dict(r) for r in rows]

    def get_class_ranking(self, teacher_id: int, date_from=None, date_to=None) -> list[dict]:
        sql = """
            SELECT u.id AS student_id, u.full_name AS student_name,
                COUNT(DISTINCT q.id) AS total_questions,
                SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct_questions
            FROM users u
            LEFT JOIN student_answers sa ON sa.student_id=u.id
            LEFT JOIN answers a ON sa.answer_id=a.id
            LEFT JOIN questions q ON a.question_id=q.id
            WHERE u.class_id IN (SELECT id FROM classes WHERE teacher_id=:tid) AND u.role='student'
        """
        params: dict = {"tid": teacher_id}
        if date_from:
            sql += " AND (sa.submitted_at IS NULL OR sa.submitted_at >= :df)"
            params["df"] = date_from
        if date_to:
            sql += " AND (sa.submitted_at IS NULL OR sa.submitted_at < :dt)"
            params["dt"] = date_to + timedelta(days=1)
        sql += " GROUP BY u.id ORDER BY correct_questions DESC"
        rows = db.session.execute(text(sql), params).mappings().all()
        return [dict(r) for r in rows]

    def get_announcements_for_student(self, student_id: int) -> list[dict]:
        sql = text("""
            SELECT id, title, content, created_at FROM announcements
            WHERE class_id=(SELECT class_id FROM users WHERE id=:sid)
            ORDER BY created_at DESC LIMIT 3
        """)
        rows = db.session.execute(sql, {"sid": student_id}).mappings().all()
        return [dict(r) for r in rows]

    def get_teacher_id_for_student(self, student_id: int) -> int | None:
        sql = text("SELECT c.teacher_id FROM users u JOIN classes c ON u.class_id=c.id WHERE u.id=:sid")
        row = db.session.execute(sql, {"sid": student_id}).mappings().first()
        return row["teacher_id"] if row else None
