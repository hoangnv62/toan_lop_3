from io import BytesIO
import pandas as pd
from extensions import db
from repositories.question_bank_repository import QuestionBankRepository
from services.question_service import import_from_excel as parse_excel
from errors import NotFoundError, ForbiddenError

qb_repo = QuestionBankRepository()


def list_questions(teacher_id: int, q: str = "", page: int = 1, limit: int = 10, lesson_id=None) -> dict:
    result = qb_repo.find_by_teacher(teacher_id, q, page, limit, lesson_id=lesson_id)
    items = [
        {
            "id":          item.id,
            "content":     item.content,
            "explanation": item.explanation,
            "lesson_id":   item.lesson_id,
            "created_at":  str(item.created_at) if item.created_at else None,
            "answers": [
                {"id": a.id, "content": a.content, "is_correct": a.is_correct}
                for a in item.answers
            ],
        }
        for item in result["items"]
    ]
    return {"items": items, "total": result["total"], "page": result["page"], "pages": result["pages"]}


def create_question(teacher_id: int, content: str, explanation, answers: list, lesson_id=None) -> int:
    q = qb_repo.create(teacher_id, content, explanation, answers, lesson_id=lesson_id)
    db.session.commit()
    return q.id


def update_question(question_id: int, teacher_id: int, content: str, explanation, answers: list, lesson_id=None) -> None:
    q = qb_repo.find_by_id(question_id)
    if not q:
        raise NotFoundError("Câu hỏi không tồn tại")
    if q.teacher_id != teacher_id:
        raise ForbiddenError()
    qb_repo.update(q, content, explanation, answers, lesson_id=lesson_id)
    db.session.commit()


def generate_sample_excel() -> BytesIO:
    rows = [
        {
            "câu hỏi":    "3 + 4 = ?",
            "đáp án a":   "5",
            "đáp án b":   "6",
            "đáp án c":   "7",
            "đáp án d":   "8",
            "đáp án đúng": "c",
            "giải thích": "3 cộng 4 bằng 7",
        },
        {
            "câu hỏi":    "10 - 6 = ?",
            "đáp án a":   "3",
            "đáp án b":   "4",
            "đáp án c":   "5",
            "đáp án d":   "6",
            "đáp án đúng": "b",
            "giải thích": "10 trừ 6 bằng 4",
        },
    ]
    buf = BytesIO()
    pd.DataFrame(rows).to_excel(buf, index=False)
    buf.seek(0)
    return buf


def import_questions_from_excel(teacher_id: int, file_bytes: bytes, lesson_id=None) -> dict:
    questions, errors = parse_excel(file_bytes)
    count = qb_repo.bulk_create(teacher_id, questions, lesson_id=lesson_id)
    db.session.commit()
    return {"imported": count, "errors": errors}


def delete_question(question_id: int, teacher_id: int) -> None:
    q = qb_repo.find_by_id(question_id)
    if not q:
        raise NotFoundError("Câu hỏi không tồn tại")
    if q.teacher_id != teacher_id:
        raise ForbiddenError()
    qb_repo.delete(q)
    db.session.commit()
