from extensions import db
from datetime import datetime


class StudentRelative(db.Model):
    __tablename__ = "student_relatives"

    id           = db.Column(db.Integer, primary_key=True)
    student_id   = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name         = db.Column(db.String(100), nullable=False)
    phone        = db.Column(db.String(20), nullable=False)
    relationship = db.Column(db.String(50), nullable=True)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship("User", back_populates="relatives")
