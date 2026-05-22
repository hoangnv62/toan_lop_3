from sqlalchemy import text
from extensions import db
from models.lesson import Lesson


class LessonRepository:
    def find_by_id(self, lesson_id: int) -> Lesson | None:
        return db.session.get(Lesson, lesson_id)

    def find_by_teacher(self, teacher_id: int, q: str = "", page: int = 1, limit: int = 10) -> dict:
        offset = (page - 1) * limit
        params = {"tid": teacher_id}
        where = "WHERE l.teacher_id=:tid"
        if q:
            where += " AND l.title LIKE :q"
            params["q"] = f"%{q}%"
        total = db.session.execute(
            text(f"SELECT COUNT(*) FROM lessons l {where}"), params
        ).scalar() or 0
        params.update({"limit": limit, "offset": offset})
        rows = db.session.execute(text(f"""
            SELECT l.*, COUNT(e.id) AS exam_count
            FROM lessons l
            LEFT JOIN exams e ON e.lesson_id = l.id
            {where}
            GROUP BY l.id ORDER BY l.created_at DESC
            LIMIT :limit OFFSET :offset
        """), params).mappings().all()
        return {
            "items": [dict(r) for r in rows],
            "total": total,
            "page": page,
            "pages": max(1, (total + limit - 1) // limit),
        }

    def create(self, teacher_id: int, title: str) -> Lesson:
        lesson = Lesson(teacher_id=teacher_id, title=title, description="")
        db.session.add(lesson)
        db.session.flush()
        return lesson

    def update(self, lesson: Lesson, title: str) -> None:
        lesson.title = title

    def delete(self, lesson: Lesson) -> None:
        db.session.delete(lesson)
