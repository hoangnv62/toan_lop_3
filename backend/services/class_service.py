from extensions import db
from repositories.class_repository import ClassRepository, ClassExamRepository, AnnouncementRepository
from repositories.lesson_repository import LessonRepository
from repositories.exam_repository import ExamRepository
from errors import NotFoundError, ConflictError

class_repo    = ClassRepository()
ce_repo       = ClassExamRepository()
ann_repo      = AnnouncementRepository()
lesson_repo   = LessonRepository()
exam_repo     = ExamRepository()


def get_teacher_classes(teacher_id: int, page: int = 1, limit: int = 12) -> dict:
    result = class_repo.find_by_teacher_with_stats(teacher_id, page, limit)
    items = []
    for r in result["items"]:
        total   = r["totalAnswers"] or 0
        correct = r["correctAnswers"] or 0
        avg_score = round(correct / total * 10, 2) if total else None
        pass_rate = round(correct / total * 100, 2) if total else 0
        status    = "good" if pass_rate >= 70 else "warning" if pass_rate >= 50 else "bad"
        items.append({
            "classId": r["classId"], "className": r["className"],
            "totalStudents": r["totalStudents"], "avgScore": avg_score,
            "passRate": pass_rate, "status": status,
        })
    return {"items": items, "total": result["total"], "page": result["page"], "pages": result["pages"]}


def get_class_detail(class_id: int, student_page: int = 1, student_limit: int = 15) -> dict:
    cls = class_repo.find_by_id(class_id)
    if not cls:
        raise NotFoundError("Lớp không tồn tại")
    paged     = class_repo.get_students_with_avg(class_id, student_page, student_limit)
    class_avg = class_repo.get_class_avg(class_id)
    return {
        "classId": cls.id, "className": cls.class_name,
        "totalStudents": paged["total"],
        "students": paged["items"],
        "studentPage": paged["page"],
        "studentPages": paged["pages"],
        "classAvg": class_avg,
    }


def add_class(teacher_id: int, class_name: str) -> None:
    class_repo.create(teacher_id, class_name)
    db.session.commit()


def update_class(class_id: int, teacher_id: int, class_name: str) -> None:
    cls = class_repo.find_by_id_and_teacher(class_id, teacher_id)
    if not cls:
        raise NotFoundError("Lớp không tồn tại")
    class_repo.update(cls, class_name)
    db.session.commit()


def delete_class(class_id: int, teacher_id: int) -> None:
    cls = class_repo.find_by_id_and_teacher(class_id, teacher_id)
    if not cls:
        raise NotFoundError("Lớp không tồn tại")
    class_repo.delete(cls)
    db.session.commit()


def get_class_exams(class_id: int, teacher_id: int) -> list:
    cls = class_repo.find_by_id_and_teacher(class_id, teacher_id)
    if not cls:
        raise NotFoundError("Lớp không tồn tại")
    rows = ce_repo.find_by_class_with_stats(class_id)
    for r in rows:
        r["deadline"]    = str(r["deadline"])    if r["deadline"]    else None
        r["assigned_at"] = str(r["assigned_at"]) if r["assigned_at"] else None
        r["open_time"]   = str(r["open_time"])   if r["open_time"]   else None
        r["time_limit"]  = int(r["time_limit"])  if r["time_limit"] is not None else None
    return rows


def assign_exam(class_id: int, teacher_id: int, exam_id: int, deadline, open_time, time_limit: int) -> None:
    if not class_repo.find_by_id_and_teacher(class_id, teacher_id):
        raise NotFoundError("Lớp không tồn tại")
    exam = exam_repo.find_by_id(exam_id)
    if not exam:
        raise NotFoundError(" Bài tập không tồn tại")
    try:
        ce_repo.assign(class_id, exam_id, deadline, open_time, time_limit)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        if "Duplicate" in str(e) or "uq_class_exam" in str(e):
            raise ConflictError(" Bài tập đã được giao cho lớp này")
        raise


def update_assignment(class_id: int, teacher_id: int, exam_id: int, deadline, open_time, time_limit: int) -> None:
    if not class_repo.find_by_id_and_teacher(class_id, teacher_id):
        raise NotFoundError("Lớp không tồn tại")
    ce = ce_repo.find_by_class_and_exam(class_id, exam_id)
    if not ce:
        raise NotFoundError(" Bài tập chưa được giao cho lớp này")
    ce_repo.update(ce, deadline, open_time, time_limit)
    db.session.commit()


def unassign_exam(class_id: int, teacher_id: int, exam_id: int) -> None:
    if not class_repo.find_by_id_and_teacher(class_id, teacher_id):
        raise NotFoundError("Lớp không tồn tại")
    ce = ce_repo.find_by_class_and_exam(class_id, exam_id)
    if not ce:
        raise NotFoundError(" Bài tập chưa được giao cho lớp này")
    ce_repo.unassign(ce)
    db.session.commit()


def get_students_with_scores(class_id: int) -> list:
    cls = class_repo.find_by_id(class_id)
    if not cls:
        raise NotFoundError("Lớp không tồn tại")
    return class_repo.get_students_with_scores(class_id)


def get_students_for_export(class_id: int, teacher_id: int) -> tuple:
    cls = class_repo.find_by_id_and_teacher(class_id, teacher_id)
    if not cls:
        raise NotFoundError("Lớp không tồn tại")
    return cls.class_name, class_repo.get_students_for_export(class_id)


def get_announcements(class_id: int) -> list:
    anns = ann_repo.find_by_class(class_id)
    return [{"id": a.id, "title": a.title, "content": a.content, "created_at": str(a.created_at) if a.created_at else None} for a in anns]


def create_announcement(class_id: int, teacher_id: int, title: str, content: str) -> int:
    if not class_repo.find_by_id_and_teacher(class_id, teacher_id):
        raise NotFoundError("Lớp không tồn tại")
    ann = ann_repo.create(class_id, teacher_id, title, content)
    db.session.commit()
    return ann.id


def delete_announcement(ann_id: int, teacher_id: int) -> None:
    ann = ann_repo.find_by_id_and_teacher(ann_id, teacher_id)
    if not ann:
        raise NotFoundError("Thông báo không tồn tại")
    ann_repo.delete(ann)
    db.session.commit()
