from extensions import db
from datetime import datetime


class QuestionBankQuestion(db.Model):
    __tablename__ = "question_bank"

    id          = db.Column(db.Integer, primary_key=True)
    teacher_id  = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content     = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text, nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship("User", back_populates="question_bank_items")
    answers = db.relationship("QuestionBankAnswer", back_populates="question", cascade="all, delete-orphan", order_by="QuestionBankAnswer.id")


class QuestionBankAnswer(db.Model):
    __tablename__ = "question_bank_answers"

    id          = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("question_bank.id", ondelete="CASCADE"), nullable=False)
    content     = db.Column(db.Text, nullable=False)
    is_correct  = db.Column(db.SmallInteger, default=0, nullable=False)

    question = db.relationship("QuestionBankQuestion", back_populates="answers")
