from extensions import db
from repositories.lesson_repository import LessonRepository
from errors import NotFoundError

lesson_repo = LessonRepository()


def get_lessons(teacher_id: int, q: str = "", page: int = 1, limit: int = 10) -> dict:
    result = lesson_repo.find_by_teacher(teacher_id, q, page, limit)
    for r in result["items"]:
        if "created_at" in r and r["created_at"]:
            r["created_at"] = str(r["created_at"])
    return result


def get_lesson(lesson_id: int) -> dict:
    lesson = lesson_repo.find_by_id(lesson_id)
    if not lesson:
        raise NotFoundError("Bài học không tồn tại")
    exams = [
        {
            "id": e.id, "name": e.name, "description": e.description,
            "date_created": str(e.date_created) if e.date_created else None,
        }
        for e in lesson.exams
    ]
    return {
        "lessonId": lesson.id, "lessonTitle": lesson.title,
        "description": lesson.description or "", "exams": exams,
    }


def create_lesson(teacher_id: int, title: str) -> None:
    lesson_repo.create(teacher_id, title)
    db.session.commit()


def update_lesson(lesson_id: int, teacher_id: int, title: str) -> None:
    lesson = lesson_repo.find_by_id(lesson_id)
    if not lesson or lesson.teacher_id != teacher_id:
        raise NotFoundError("Bài học không tồn tại")
    lesson_repo.update(lesson, title)
    db.session.commit()


def delete_lesson(lesson_id: int, teacher_id: int) -> None:
    lesson = lesson_repo.find_by_id(lesson_id)
    if not lesson or lesson.teacher_id != teacher_id:
        raise NotFoundError("Bài học không tồn tại")
    lesson_repo.delete(lesson)
    db.session.commit()
