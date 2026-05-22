from extensions import db
from datetime import datetime


class Lesson(db.Model):
    __tablename__ = "lessons"

    id          = db.Column(db.Integer, primary_key=True)
    teacher_id  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title       = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship("User", back_populates="lessons")
    exams   = db.relationship("Exam", back_populates="lesson", cascade="all, delete-orphan")
