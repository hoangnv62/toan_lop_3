from extensions import db
from datetime import datetime


class Class(db.Model):
    __tablename__ = "classes"

    id         = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    class_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher       = db.relationship("User", foreign_keys=[teacher_id], back_populates="taught_classes")
    students      = db.relationship("User", foreign_keys="User.class_id", back_populates="enrolled_class")
    class_exams   = db.relationship("ClassExam", back_populates="class_", cascade="all, delete-orphan")
    announcements = db.relationship("Announcement", back_populates="class_", cascade="all, delete-orphan")


class ClassExam(db.Model):
    __tablename__ = "class_exams"
    __table_args__ = (db.UniqueConstraint("class_id", "exam_id", name="uq_class_exam"),)

    id          = db.Column(db.Integer, primary_key=True)
    class_id    = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    exam_id     = db.Column(db.Integer, db.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    deadline    = db.Column(db.DateTime, nullable=True)
    open_time   = db.Column(db.DateTime, nullable=True)
    time_limit  = db.Column(db.Integer, nullable=False, default=1200)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    class_ = db.relationship("Class", back_populates="class_exams")
    exam   = db.relationship("Exam", back_populates="class_exams")


class Announcement(db.Model):
    __tablename__ = "announcements"

    id         = db.Column(db.Integer, primary_key=True)
    class_id   = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title      = db.Column(db.String(255), nullable=False)
    content    = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    class_ = db.relationship("Class", back_populates="announcements")
