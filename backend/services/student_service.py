from io import BytesIO
import pandas as pd
from extensions import db
from repositories.user_repository import UserRepository
from repositories.class_repository import ClassRepository
from repositories.student_repository import StudentRepository
from errors import NotFoundError, ConflictError

user_repo    = UserRepository()
class_repo   = ClassRepository()
student_repo = StudentRepository()


def search_students(q: str, class_id: int = None) -> list:
    students = user_repo.search_students(q)
    for s in students:
        s["already_in_class"] = (class_id is not None and s["class_id"] == class_id)
        if s.get("dob"):
            s["dob"] = str(s["dob"])
    return students


def add_to_class(class_id: int, teacher_id: int, username: str) -> str:
    if not class_repo.find_by_id_and_teacher(class_id, teacher_id):
        raise NotFoundError("Lớp không tồn tại")
    student = user_repo.find_by_username_and_role(username, "student")
    if not student:
        raise NotFoundError(f'Không tìm thấy học sinh "{username}"')
    if student.class_id == class_id:
        raise ConflictError("Học sinh đã trong lớp này")
    student_repo.add_to_class(student, class_id)
    db.session.commit()
    return student.full_name


def upload_students(class_id: int, teacher_id: int, file_bytes: bytes) -> dict:
    if not class_repo.find_by_id_and_teacher(class_id, teacher_id):
        raise NotFoundError("Lớp không tồn tại")
    df = pd.read_excel(BytesIO(file_bytes))
    df.columns = df.columns.str.strip().str.lower()
    if "username" not in df.columns:
        raise ValueError("File thiếu cột: username")

    success_count = 0
    errors        = []
    for _, row in df.iterrows():
        username = str(row["username"]).strip()
        if not username or username == "nan":
            errors.append("Bỏ qua dòng trống")
            continue
        student = user_repo.find_by_username_and_role(username, "student")
        if not student:
            errors.append(f'Không tìm thấy học sinh "{username}"')
            continue
        if student.class_id == class_id:
            errors.append(f'"{username}" đã trong lớp này')
            continue
        student_repo.add_to_class(student, class_id)
        success_count += 1

    if success_count == 0:
        raise NotFoundError("Không tìm thấy học sinh")
    db.session.commit()
    return {"count": success_count, "errors": errors}


def remove_from_class(class_id: int, teacher_id: int, student_id: int) -> None:
    if not class_repo.find_by_id_and_teacher(class_id, teacher_id):
        raise NotFoundError("Lớp không tồn tại")
    student = user_repo.find_by_id(student_id)
    if not student or student.class_id != class_id:
        raise NotFoundError("Học sinh không trong lớp này")
    student_repo.remove_from_class(student)
    db.session.commit()


def get_student_results(student_id: int) -> dict:
    student = student_repo.find_by_id(student_id)
    if not student:
        raise NotFoundError("Học sinh không tồn tại")
    results = student_repo.get_results(student_id)
    for r in results:
        if r.get("submittedAt"):
            r["submittedAt"] = str(r["submittedAt"])
        if r.get("score") is not None:
            r["score"] = float(r["score"])
    return {"studentName": student.full_name, "results": results}


def get_student_progress(student_id: int) -> list:
    rows = student_repo.get_progress(student_id)
    for r in rows:
        r["submittedAt"] = str(r["submittedAt"]) if r.get("submittedAt") else None
        r["score"]       = float(r["score"] or 0)
    return rows


def get_student_dashboard(student_id: int, show_all: bool, date_from=None, date_to=None) -> dict:
    teacher_id = student_repo.get_teacher_id_for_student(student_id)
    if not teacher_id:
        return {
            "exams": [], "scores": [], "ranking": [],
            "progress": {"totalExams": 0, "done": 0, "avg": None},
            "announcements": [],
        }

    df = None if show_all else date_from
    dt = None if show_all else date_to

    lesson_rows  = student_repo.get_lessons_with_stats(student_id, df, dt)
    ranking_rows = student_repo.get_class_ranking(teacher_id, df, dt)
    announcements = student_repo.get_announcements_for_student(student_id)
    for a in announcements:
        a["created_at"] = str(a["created_at"]) if a.get("created_at") else None

    exams  = []
    scores = []
    for r in lesson_rows:
        done  = bool(r["done"])
        score = None
        if done and r["total_questions"]:
            score = round(float(r["correct_questions"] or 0) / float(r["total_questions"]) * 10, 1)
        exams.append({
            "examId":     r["exam_id"],  "examName":   r["exam_name"],
            "lessonTitle": r["lesson_name"], "done": done, "score": score,
            "deadline":   str(r["deadline"])  if r.get("deadline")  else None,
            "openTime":   str(r["open_time"]) if r.get("open_time") else None,
        })
        if done and score is not None:
            scores.append({"examName": r["exam_name"], "score": score})

    done_count = sum(1 for e in exams if e["done"])
    avg        = round(sum(s["score"] for s in scores) / len(scores), 1) if scores else None
    ranking    = [
        {
            "studentId": r["student_id"], "name": r["student_name"],
            "avg": round(float(r["correct_questions"] or 0) / float(r["total_questions"]) * 10, 1)
                   if r["total_questions"] else 0,
        }
        for r in ranking_rows
    ]

    return {
        "exams": exams, "scores": scores, "ranking": ranking,
        "progress": {"totalExams": len(exams), "done": done_count, "avg": avg},
        "announcements": announcements,
    }
