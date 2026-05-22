from extensions import db
from datetime import datetime


class StudentAnswer(db.Model):
    __tablename__ = "student_answers"

    id           = db.Column(db.Integer, primary_key=True)
    student_id   = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exam_id      = db.Column(db.Integer, db.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    answer_id    = db.Column(db.Integer, db.ForeignKey("answers.id", ondelete="CASCADE"), nullable=False)
    time_spent   = db.Column(db.Integer, default=0)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship("User", back_populates="student_answers")
    exam    = db.relationship("Exam")
    answer  = db.relationship("Answer", back_populates="student_answers")


class StudentExamComment(db.Model):
    __tablename__ = "student_exam_comments"
    __table_args__ = (db.UniqueConstraint("exam_id", "student_id", name="uq_sec"),)

    id         = db.Column(db.Integer, primary_key=True)
    exam_id    = db.Column(db.Integer, db.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    comment    = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
