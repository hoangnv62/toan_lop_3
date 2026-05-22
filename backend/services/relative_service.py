from extensions import db
from repositories.relative_repository import RelativeRepository
from errors import NotFoundError, ForbiddenError, AppError

relative_repo = RelativeRepository()
MAX_RELATIVES = 5


def get_relatives(student_id: int) -> list:
    rels = relative_repo.find_by_student(student_id)
    return [
        {"id": r.id, "name": r.name, "phone": r.phone,
         "relationship": r.relationship, "created_at": str(r.created_at) if r.created_at else None}
        for r in rels
    ]


def add_relative(student_id: int, name: str, phone: str, relationship) -> int:
    if relative_repo.count_by_student(student_id) >= MAX_RELATIVES:
        raise AppError(f"Tối đa {MAX_RELATIVES} người thân", 400)
    rel = relative_repo.create(student_id, name, phone, relationship)
    db.session.commit()
    return rel.id


def update_relative(relative_id: int, student_id: int, name: str, phone: str, relationship) -> None:
    rel = relative_repo.find_by_id(relative_id)
    if not rel:
        raise NotFoundError("Không tìm thấy người thân")
    if rel.student_id != student_id:
        raise ForbiddenError("Không có quyền truy cập")
    relative_repo.update(rel, name, phone, relationship)
    db.session.commit()


def delete_relative(relative_id: int, student_id: int) -> None:
    rel = relative_repo.find_by_id(relative_id)
    if not rel:
        raise NotFoundError("Không tìm thấy người thân")
    if rel.student_id != student_id:
        raise ForbiddenError("Không có quyền truy cập")
    relative_repo.delete(rel)
    db.session.commit()
