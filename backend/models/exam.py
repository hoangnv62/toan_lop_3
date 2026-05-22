from extensions import db
from datetime import datetime


class Exam(db.Model):
    __tablename__ = "exams"

    id           = db.Column(db.Integer, primary_key=True)
    lesson_id    = db.Column(db.Integer, db.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    name         = db.Column(db.String(255), nullable=False)
    description  = db.Column(db.Text, nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)

    lesson      = db.relationship("Lesson", back_populates="exams")
    questions   = db.relationship("Question", back_populates="exam", cascade="all, delete-orphan", order_by="Question.id")
    class_exams = db.relationship("ClassExam", back_populates="exam", cascade="all, delete-orphan")


class Question(db.Model):
    __tablename__ = "questions"

    id          = db.Column(db.Integer, primary_key=True)
    exam_id     = db.Column(db.Integer, db.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    content     = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text, nullable=True)

    exam    = db.relationship("Exam", back_populates="questions")
    answers = db.relationship("Answer", back_populates="question", cascade="all, delete-orphan", order_by="Answer.id")


class Answer(db.Model):
    __tablename__ = "answers"

    id          = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    content     = db.Column(db.Text, nullable=False)
    is_correct  = db.Column(db.SmallInteger, default=0)

    question        = db.relationship("Question", back_populates="answers")
    student_answers = db.relationship("StudentAnswer", back_populates="answer")
