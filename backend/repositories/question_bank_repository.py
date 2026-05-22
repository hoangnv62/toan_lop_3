from sqlalchemy import func
from extensions import db
from models.question_bank import QuestionBankQuestion, QuestionBankAnswer


class QuestionBankRepository:
    def find_by_teacher(self, teacher_id: int, q: str = "", page: int = 1, limit: int = 10) -> dict:
        offset = (page - 1) * limit
        base = db.select(QuestionBankQuestion).where(QuestionBankQuestion.teacher_id == teacher_id)
        if q:
            base = base.where(QuestionBankQuestion.content.ilike(f"%{q}%"))
        total = db.session.execute(db.select(func.count()).select_from(base.subquery())).scalar() or 0
        items = db.session.execute(
            base.order_by(QuestionBankQuestion.created_at.desc()).offset(offset).limit(limit)
        ).scalars().all()
        return {
            "items": items,
            "total": total,
            "page": page,
            "pages": max(1, (total + limit - 1) // limit),
        }

    def find_by_id_and_teacher(self, question_id: int, teacher_id: int) -> QuestionBankQuestion | None:
        return db.session.execute(
            db.select(QuestionBankQuestion).where(
                QuestionBankQuestion.id == teacher_id,
                QuestionBankQuestion.teacher_id == teacher_id,
            )
        ).scalar_one_or_none()

    def find_by_id(self, question_id: int) -> QuestionBankQuestion | None:
        return db.session.get(QuestionBankQuestion, question_id)

    def create(self, teacher_id: int, content: str, explanation, answers_data: list) -> QuestionBankQuestion:
        q = QuestionBankQuestion(teacher_id=teacher_id, content=content, explanation=explanation)
        db.session.add(q)
        db.session.flush()
        for a in answers_data:
            db.session.add(QuestionBankAnswer(question_id=q.id, content=a.get("content", ""), is_correct=1 if a.get("is_correct") else 0))
        return q

    def update(self, q: QuestionBankQuestion, content: str, explanation, answers_data: list) -> None:
        q.content     = content
        q.explanation = explanation
        for old_a in list(q.answers):
            db.session.delete(old_a)
        db.session.flush()
        for a in answers_data:
            db.session.add(QuestionBankAnswer(question_id=q.id, content=a.get("content", ""), is_correct=1 if a.get("is_correct") else 0))

    def bulk_create(self, teacher_id: int, questions_data: list) -> int:
        count = 0
        for qd in questions_data:
            q = QuestionBankQuestion(
                teacher_id=teacher_id,
                content=qd["questionContent"],
                explanation=qd.get("explanation") or None,
            )
            db.session.add(q)
            db.session.flush()
            for a in qd.get("answers", []):
                db.session.add(QuestionBankAnswer(
                    question_id=q.id,
                    content=a.get("content", ""),
                    is_correct=1 if a.get("isCorrected") else 0,
                ))
            count += 1
        return count

    def delete(self, q: QuestionBankQuestion) -> None:
        db.session.delete(q)
