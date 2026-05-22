from extensions import db
from models.relative import StudentRelative


class RelativeRepository:
    def find_by_student(self, student_id: int) -> list[StudentRelative]:
        return db.session.execute(
            db.select(StudentRelative)
            .where(StudentRelative.student_id == student_id)
            .order_by(StudentRelative.created_at.asc())
        ).scalars().all()

    def count_by_student(self, student_id: int) -> int:
        return db.session.execute(
            db.select(db.func.count()).select_from(StudentRelative).where(StudentRelative.student_id == student_id)
        ).scalar()

    def find_by_id(self, relative_id: int) -> StudentRelative | None:
        return db.session.get(StudentRelative, relative_id)

    def create(self, student_id: int, name: str, phone: str, relationship) -> StudentRelative:
        rel = StudentRelative(student_id=student_id, name=name, phone=phone, relationship=relationship)
        db.session.add(rel)
        db.session.flush()
        return rel

    def update(self, rel: StudentRelative, name: str, phone: str, relationship) -> None:
        rel.name         = name
        rel.phone        = phone
        rel.relationship = relationship

    def delete(self, rel: StudentRelative) -> None:
        db.session.delete(rel)
