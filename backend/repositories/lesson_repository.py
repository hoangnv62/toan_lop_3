from sqlalchemy import text
from extensions import db
from models.lesson import Lesson


class LessonRepository:
    def find_by_id(self, lesson_id: int) -> Lesson | None:
        return db.session.get(Lesson, lesson_id)

    def find_by_teacher(self, teacher_id: int, q: str = "") -> list[dict]:
        sql_base = """
            SELECT l.*, COUNT(e.id) AS exam_count
            FROM lessons l
            LEFT JOIN exams e ON e.lesson_id = l.id
            WHERE l.teacher_id=:tid
        """
        params = {"tid": teacher_id}
        if q:
            sql_base += " AND l.title LIKE :q"
            params["q"] = f"%{q}%"
        sql_base += " GROUP BY l.id ORDER BY l.created_at DESC"
        rows = db.session.execute(text(sql_base), params).mappings().all()
        return [dict(r) for r in rows]

    def create(self, teacher_id: int, title: str) -> Lesson:
        lesson = Lesson(teacher_id=teacher_id, title=title, description="")
        db.session.add(lesson)
        db.session.flush()
        return lesson

    def update(self, lesson: Lesson, title: str) -> None:
        lesson.title = title

    def delete(self, lesson: Lesson) -> None:
        db.session.delete(lesson)
