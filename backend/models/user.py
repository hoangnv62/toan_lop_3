from extensions import db
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(50), unique=True, nullable=False)
    password   = db.Column(db.String(255), nullable=False)
    full_name  = db.Column(db.String(100), nullable=False)
    role       = db.Column(db.Enum("teacher", "student"), nullable=False)
    dob        = db.Column(db.Date, nullable=True)
    class_id   = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    enrolled_class       = db.relationship("Class", foreign_keys=[class_id], back_populates="students")
    taught_classes       = db.relationship("Class", foreign_keys="Class.teacher_id", back_populates="teacher")
    lessons              = db.relationship("Lesson", back_populates="teacher", cascade="all, delete-orphan")
    student_answers      = db.relationship("StudentAnswer", back_populates="student", cascade="all, delete-orphan")
    relatives            = db.relationship("StudentRelative", back_populates="student", cascade="all, delete-orphan")
    question_bank_items  = db.relationship("QuestionBankQuestion", back_populates="teacher", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":        self.id,
            "username":  self.username,
            "full_name": self.full_name,
            "role":      self.role,
            "dob":       str(self.dob) if self.dob else None,
            "class_id":  self.class_id,
        }


class StudentParent(db.Model):
    __tablename__ = "student_parents"

    id           = db.Column(db.Integer, primary_key=True)
    student_id   = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    parent_name  = db.Column(db.String(100))
    parent_phone = db.Column(db.String(20), unique=True)
