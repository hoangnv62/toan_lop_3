from io import BytesIO
from urllib.parse import quote
from flask import Response
from pydantic import BaseModel as _BaseModel
from extensions import db
from repositories.exam_repository import ExamRepository, StudentAnswerRepository
from repositories.class_repository import ClassExamRepository
from errors import NotFoundError, ConflictError
from services.pdf_service import build_exam_pdf
from config import init_chat_model
import openpyxl


class _Feedback(_BaseModel):
    feedback: str

class _Insight(_BaseModel):
    title: str
    detail: str

class _StatsAnalysis(_BaseModel):
    insights: list[_Insight]

exam_repo    = ExamRepository()
sa_repo      = StudentAnswerRepository()
ce_repo      = ClassExamRepository()


def get_exam(exam_id: int, student_id: int = None) -> dict:
    exam = exam_repo.find_by_id(exam_id)
    if not exam:
        raise NotFoundError(" Bài tập không tồn tại")
    time_limit = None
    if student_id:
        row = ce_repo.find_for_student(student_id, exam_id)
        time_limit = int(row["time_limit"]) if row else 20 * 60
    return {
        "name":        exam.name,
        "description": exam.description,
        "dateCreated": str(exam.date_created) if exam.date_created else None,
        "timeLimit":   time_limit,
        "questions": [
            {
                "questionId":      q.id,
                "questionContent": q.content,
                "explanation":     q.explanation,
                "answers": [
                    {"answerId": a.id, "content": a.content, "isCorrected": a.is_correct}
                    for a in q.answers
                ],
            }
            for q in exam.questions
        ],
    }


def get_assignments(exam_id: int, teacher_id: int) -> list:
    rows = ce_repo.find_by_exam_and_teacher(exam_id, teacher_id)
    for r in rows:
        r["assigned"]    = bool(r["assigned"])
        r["deadline"]    = str(r["deadline"])    if r["deadline"]    else None
        r["assigned_at"] = str(r["assigned_at"]) if r["assigned_at"] else None
        r["open_time"]   = str(r["open_time"])   if r["open_time"]   else None
        r["time_limit"]  = int(r["time_limit"])  if r["time_limit"] is not None else None
    return rows


def create_exam(lesson_id: int, name: str, description: str, questions: list) -> int:
    exam = exam_repo.create(lesson_id, name, description, questions)
    db.session.commit()
    return exam.id


def update_exam(exam_id: int, lesson_id: int, name: str, description: str, questions: list) -> None:
    exam = exam_repo.find_by_id(exam_id)
    if not exam or exam.lesson_id != lesson_id:
        raise NotFoundError(" Bài tập không tồn tại")
    exam_repo.update(exam, name, description, questions)
    db.session.commit()


def delete_exam(exam_id: int) -> None:
    exam = exam_repo.find_by_id(exam_id)
    if not exam:
        raise NotFoundError(" Bài tập không tồn tại")
    exam_repo.delete(exam)
    db.session.commit()


def clone_exam(exam_id: int) -> int:
    exam = exam_repo.find_by_id(exam_id)
    if not exam:
        raise NotFoundError(" Bài tập không tồn tại")
    new_exam = exam_repo.clone(exam)
    db.session.commit()
    return new_exam.id


def submit_exam(exam_id: int, student_id: int, answers: list, time_spent: int) -> dict:
    if sa_repo.has_submitted(student_id, exam_id):
        raise ConflictError("Bạn đã nộp bài rồi!")
    result = sa_repo.submit(student_id, exam_id, answers, time_spent)
    db.session.commit()
    return result


def get_result(exam_id: int, student_id: int) -> dict:
    data = exam_repo.get_exam_result(exam_id, student_id)
    if not data:
        raise NotFoundError(" Bài tập không tồn tại")
    return data


def get_stats(exam_id: int) -> dict:
    exam = exam_repo.find_by_id(exam_id)
    if not exam:
        raise NotFoundError(" Bài tập không tồn tại")
    raw = exam_repo.get_stats(exam_id)
    scores         = raw["scores"]
    total_students = raw["total_students"]
    question_rows  = raw["question_rows"]

    dist = {"0-4": 0, "4-6": 0, "6-8": 0, "8-10": 0}
    for s in scores:
        if s < 4:   dist["0-4"] += 1
        elif s < 6: dist["4-6"] += 1
        elif s < 8: dist["6-8"] += 1
        else:       dist["8-10"] += 1

    questions_stats = []
    for qr in question_rows:
        ta = int(qr["totalAnswered"] or 0)
        cc = int(qr["correctCount"]  or 0)
        questions_stats.append({
            "questionId":    qr["questionId"],
            "content":       qr["content"],
            "totalAnswered": ta,
            "correctCount":  cc,
            "correctRate":   round(cc / ta * 100, 1) if ta > 0 else 0,
        })

    return {
        "examName":          exam.name,
        "totalStudents":     total_students,
        "completedStudents": len(scores),
        "avgScore":          round(sum(scores) / len(scores), 1) if scores else 0,
        "distribution":      dist,
        "questions":         questions_stats,
    }


def generate_ai_feedback(exam_id: int, student_id: int) -> str:
    data  = get_result(exam_id, student_id)
    wrong = [q for q in data.get("questions", []) if not q.get("isCorrect")]
    if not wrong:
        return "Xuất sắc! Em đã trả lời đúng tất cả các câu hỏi. Hãy tiếp tục phát huy nhé!"
    lines = []
    for q in wrong:
        correct = next((a["content"] for a in q.get("answers", []) if a.get("isCorrected") == 1), "")
        chosen  = next((a["content"] for a in q.get("answers", []) if a.get("isSelected") and a.get("isCorrected") != 1), "không rõ")
        lines.append(f'- "{q["questionContent"]}"\n  Đáp án đúng: {correct} | Em chọn: {chosen}')
    prompt = f"""Bạn là giáo viên Toán lớp 3 đang nhận xét bài làm của học sinh.
Bài kiểm tra: {data.get("examName", "Toán lớp 3")}
Kết quả: {data.get("score", 0)}/10 — đúng {data.get("correct", 0)}/{data.get("total", 0)} câu.

Các câu trả lời sai:
{chr(10).join(lines)}

Viết 1 đoạn nhận xét (2-4 câu) bằng tiếng Việt, thân thiện dành cho học sinh lớp 3: chỉ ra lỗi sai cụ thể và cách khắc phục, kết bằng lời khích lệ.
"""
    result = init_chat_model().generate(prompt, response_model=_Feedback)
    return result.feedback


def analyze_exam_stats(exam_id: int) -> list:
    stats = get_stats(exam_id)
    if not stats.get("completedStudents"):
        return []
    qs = stats.get("questions", [])
    hard = [q for q in qs if q.get("totalAnswered", 0) > 0 and q.get("correctRate", 100) < 50]
    if not hard:
        hard = sorted(qs, key=lambda q: q.get("correctRate", 100))[:3]
    hard_summary = "\n".join(
        f'- Câu {i+1}: "{q["content"][:80]}" — tỉ lệ đúng {q["correctRate"]}% ({q["correctCount"]}/{q["totalAnswered"]} HS)'
        for i, q in enumerate(hard)
    )
    dist = stats.get("distribution", {})
    prompt = f"""Bạn là chuyên gia giáo dục Toán lớp 3. Phân tích kết quả bài kiểm tra:
Tên bài: {stats.get("examName", "")}
Học sinh nộp bài: {stats.get("completedStudents", 0)}/{stats.get("totalStudents", 0)}
Điểm trung bình: {stats.get("avgScore", 0)}/10
Phân bố: 0-4: {dist.get("0-4",0)} HS, 4-6: {dist.get("4-6",0)} HS, 6-8: {dist.get("6-8",0)} HS, 8-10: {dist.get("8-10",0)} HS.

Câu hỏi học sinh làm sai nhiều nhất:
{hard_summary}

Đưa ra CHÍNH XÁC 3 nhận xét và lời khuyên thực tế cho giáo viên Toán lớp 3 dựa trên dữ liệu trên, trả lời bằng tiếng việt.
"""
    result = init_chat_model().generate(prompt, response_model=_StatsAnalysis)
    return [i.model_dump() for i in result.insights]


def save_comment(exam_id: int, student_id: int, teacher_id: int, comment: str) -> None:
    exam_repo.upsert_comment(exam_id, student_id, teacher_id, comment)
    db.session.commit()


def export_pdf(exam_id: int, variants_count: int, duration: int) -> Response:
    exam = exam_repo.find_by_id(exam_id)
    if not exam:
        raise NotFoundError(" Bài tập không tồn tại")
    questions = [
        {
            "question_id": q.id,
            "content":     q.content,
            "answers": [
                {"answer_id": a.id, "content": a.content, "is_correct": bool(a.is_correct)}
                for a in q.answers
            ],
        }
        for q in exam.questions
    ]
    pdf_bytes = build_exam_pdf(exam.name, duration, questions, variants_count)
    safe_name = quote(exam.name)
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{safe_name}.pdf"},
    )


def export_results(exam_id: int) -> Response:
    exam = exam_repo.find_by_id(exam_id)
    if not exam:
        raise NotFoundError(" Bài tập không tồn tại")
    rows = exam_repo.get_export_data(exam_id)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Kết quả thi"
    ws.append(["STT", "Họ tên", "Username", "Điểm", "Số câu đúng", "Tổng câu", "Thời gian (giây)", "Thời gian nộp"])
    for i, row in enumerate(rows, 1):
        ws.append([
            i, row["full_name"], row["username"],
            float(row["score"] or 0), int(row["correct_count"] or 0),
            int(row["total_questions"] or 0), int(row["time_spent"] or 0),
            str(row["submitted_at"]) if row["submitted_at"] else "",
        ])

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    safe_name = quote(exam.name)
    return Response(
        buf.getvalue(),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{safe_name}.xlsx"},
    )
