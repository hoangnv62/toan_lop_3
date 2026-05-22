from extensions import db
from repositories.question_bank_repository import QuestionBankRepository
from errors import NotFoundError, ForbiddenError

qb_repo = QuestionBankRepository()


def list_questions(teacher_id: int) -> list:
    items = qb_repo.find_by_teacher(teacher_id)
    result = []
    for q in items:
        result.append({
            "id":          q.id,
            "content":     q.content,
            "explanation": q.explanation,
            "created_at":  str(q.created_at) if q.created_at else None,
            "answers": [
                {"id": a.id, "content": a.content, "is_correct": a.is_correct}
                for a in q.answers
            ],
        })
    return result


def create_question(teacher_id: int, content: str, explanation, answers: list) -> int:
    q = qb_repo.create(teacher_id, content, explanation, answers)
    db.session.commit()
    return q.id


def update_question(question_id: int, teacher_id: int, content: str, explanation, answers: list) -> None:
    q = qb_repo.find_by_id(question_id)
    if not q:
        raise NotFoundError("Câu hỏi không tồn tại")
    if q.teacher_id != teacher_id:
        raise ForbiddenError()
    qb_repo.update(q, content, explanation, answers)
    db.session.commit()


def delete_question(question_id: int, teacher_id: int) -> None:
    q = qb_repo.find_by_id(question_id)
    if not q:
        raise NotFoundError("Câu hỏi không tồn tại")
    if q.teacher_id != teacher_id:
        raise ForbiddenError()
    qb_repo.delete(q)
    db.session.commit()
