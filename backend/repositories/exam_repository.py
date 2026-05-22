from sqlalchemy import text
from extensions import db
from models.exam import Exam, Question, Answer
from models.student import StudentExamComment


class ExamRepository:
    def find_by_id(self, exam_id: int) -> Exam | None:
        return db.session.get(Exam, exam_id)

    def find_by_lesson(self, lesson_id: int) -> list[Exam]:
        return db.session.execute(
            db.select(Exam).where(Exam.lesson_id == lesson_id).order_by(Exam.date_created.desc())
        ).scalars().all()

    def create(self, lesson_id: int, name: str, description: str, questions_data: list) -> Exam:
        exam = Exam(lesson_id=lesson_id, name=name, description=description)
        db.session.add(exam)
        db.session.flush()
        for q_data in questions_data:
            q = Question(exam_id=exam.id, content=q_data.get("questionContent"), explanation=q_data.get("explanation"))
            db.session.add(q)
            db.session.flush()
            for a_data in q_data.get("answers", []):
                db.session.add(Answer(question_id=q.id, content=a_data.get("content"), is_correct=1 if a_data.get("isCorrected") else 0))
        return exam

    def update(self, exam: Exam, name: str, description: str, questions_data: list) -> None:
        exam.name        = name
        exam.description = description

        existing_q_ids = {q.id for q in exam.questions}
        client_q_ids   = set()

        for q_data in questions_data:
            q_id = q_data.get("questionId")
            if q_id:
                q = db.session.get(Question, q_id)
                if q:
                    q.content     = q_data.get("questionContent")
                    q.explanation = q_data.get("explanation")
            else:
                q = Question(exam_id=exam.id, content=q_data.get("questionContent"), explanation=q_data.get("explanation"))
                db.session.add(q)
                db.session.flush()
                q_id = q.id
            client_q_ids.add(q_id)

            existing_a_ids = {a.id for a in (db.session.get(Question, q_id).answers if q_id else [])}
            client_a_ids   = set()
            for a_data in q_data.get("answers", []):
                a_id = a_data.get("answerId")
                if a_id:
                    a = db.session.get(Answer, a_id)
                    if a:
                        a.content    = a_data.get("content")
                        a.is_correct = 1 if a_data.get("isCorrected") else 0
                else:
                    a = Answer(question_id=q_id, content=a_data.get("content"), is_correct=1 if a_data.get("isCorrected") else 0)
                    db.session.add(a)
                    db.session.flush()
                    a_id = a.id
                client_a_ids.add(a_id)
            for stale_a in (existing_a_ids - client_a_ids):
                obj = db.session.get(Answer, stale_a)
                if obj:
                    db.session.delete(obj)

        for stale_q in (existing_q_ids - client_q_ids):
            obj = db.session.get(Question, stale_q)
            if obj:
                db.session.delete(obj)

    def delete(self, exam: Exam) -> None:
        db.session.delete(exam)

    def clone(self, exam: Exam) -> Exam:
        new_exam = Exam(lesson_id=exam.lesson_id, name=f"{exam.name} (Bản sao)", description=exam.description)
        db.session.add(new_exam)
        db.session.flush()
        for q in exam.questions:
            new_q = Question(exam_id=new_exam.id, content=q.content, explanation=q.explanation)
            db.session.add(new_q)
            db.session.flush()
            for a in q.answers:
                db.session.add(Answer(question_id=new_q.id, content=a.content, is_correct=a.is_correct))
        return new_exam

    def get_exam_result(self, exam_id: int, student_id: int) -> dict | None:
        sql = text("""
            SELECT e.name AS exam_name, l.title AS lesson_name,
                MAX(sa.time_spent) AS time_spent,
                MAX(sa.submitted_at) AS submitted_at
            FROM exams e
            JOIN lessons l ON e.lesson_id=l.id
            LEFT JOIN student_answers sa ON sa.exam_id=e.id AND sa.student_id=:sid
            WHERE e.id=:eid GROUP BY e.id
        """)
        exam_info = db.session.execute(sql, {"eid": exam_id, "sid": student_id}).mappings().first()
        if not exam_info:
            return None

        sql2 = text("""
            SELECT q.id AS question_id, q.content AS question_content, q.explanation,
                a.id AS answer_id, a.content AS answer_content,
                a.is_correct, sa.answer_id AS student_answer_id
            FROM questions q
            JOIN answers a ON a.question_id=q.id
            LEFT JOIN student_answers sa ON sa.answer_id=a.id AND sa.student_id=:sid AND sa.exam_id=:eid
            WHERE q.exam_id=:eid ORDER BY q.id, a.id
        """)
        rows = db.session.execute(sql2, {"sid": student_id, "eid": exam_id}).mappings().all()

        question_map = {}
        for r in rows:
            qid = r["question_id"]
            if qid not in question_map:
                question_map[qid] = {
                    "questionId": qid, "questionContent": r["question_content"],
                    "explanation": r["explanation"], "isCorrect": False,
                    "selectedAnswerId": None, "answers": [],
                }
            ans = {
                "answerId": r["answer_id"], "content": r["answer_content"],
                "isCorrected": r["is_correct"], "isSelected": r["student_answer_id"] == r["answer_id"],
            }
            if ans["isSelected"]:
                question_map[qid]["selectedAnswerId"] = r["answer_id"]
            question_map[qid]["answers"].append(ans)

        questions     = list(question_map.values())
        correct_count = 0
        for q in questions:
            correct_ans  = next((a for a in q["answers"] if a["isCorrected"] == 1), None)
            q["isCorrect"] = correct_ans is not None and q["selectedAnswerId"] == correct_ans["answerId"]
            if q["isCorrect"]:
                correct_count += 1
        score = round(correct_count / len(questions) * 10, 1) if questions else 0

        cmt_row = db.session.execute(
            db.select(StudentExamComment).where(
                StudentExamComment.exam_id == exam_id, StudentExamComment.student_id == student_id
            )
        ).scalar_one_or_none()

        return {
            "examName":       dict(exam_info)["exam_name"],
            "lessonName":     dict(exam_info)["lesson_name"],
            "timeSpent":      dict(exam_info)["time_spent"] or 0,
            "submittedAt":    str(dict(exam_info)["submitted_at"]) if dict(exam_info)["submitted_at"] else None,
            "score":          score,
            "correct":        correct_count,
            "total":          len(questions),
            "questions":      questions,
            "teacherComment": cmt_row.comment if cmt_row else None,
        }

    def get_stats(self, exam_id: int) -> dict:
        sql_scores = text("""
            SELECT sa.student_id,
                ROUND(SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT q.id),0)*10, 1) AS score
            FROM student_answers sa
            JOIN answers a ON sa.answer_id=a.id
            JOIN questions q ON a.question_id=q.id
            WHERE sa.exam_id=:eid GROUP BY sa.student_id
        """)
        scores = [float(r["score"] or 0) for r in db.session.execute(sql_scores, {"eid": exam_id}).mappings()]

        exam = db.session.get(Exam, exam_id)
        sql_total = text("""
            SELECT COUNT(DISTINCT u.id) AS total FROM users u
            JOIN classes c ON u.class_id=c.id
            WHERE c.teacher_id=(SELECT teacher_id FROM lessons WHERE id=:lid) AND u.role='student'
        """)
        total_row = db.session.execute(sql_total, {"lid": exam.lesson_id}).mappings().first()

        sql_q = text("""
            SELECT q.id AS questionId, q.content,
                COUNT(DISTINCT sa.student_id) AS totalAnswered,
                SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correctCount
            FROM questions q
            LEFT JOIN answers a ON a.question_id=q.id
            LEFT JOIN student_answers sa ON sa.answer_id=a.id AND sa.exam_id=:eid
            WHERE q.exam_id=:eid GROUP BY q.id ORDER BY q.id
        """)
        q_rows = db.session.execute(sql_q, {"eid": exam_id}).mappings().all()
        return {"scores": scores, "total_students": total_row["total"] if total_row else 0, "question_rows": [dict(r) for r in q_rows]}

    def get_export_data(self, exam_id: int) -> list[dict]:
        sql = text("""
            SELECT u.full_name, u.username,
                ROUND(SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END)*10.0/NULLIF(COUNT(DISTINCT q.id),0),1) AS score,
                SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct_count,
                COUNT(DISTINCT q.id) AS total_questions,
                MAX(sa.time_spent) AS time_spent, MAX(sa.submitted_at) AS submitted_at
            FROM student_answers sa
            JOIN users u ON u.id=sa.student_id
            JOIN answers a ON sa.answer_id=a.id
            JOIN questions q ON a.question_id=q.id
            WHERE sa.exam_id=:eid GROUP BY sa.student_id ORDER BY score DESC
        """)
        rows = db.session.execute(sql, {"eid": exam_id}).mappings().all()
        return [dict(r) for r in rows]

    def upsert_comment(self, exam_id: int, student_id: int, teacher_id: int, comment: str) -> None:
        existing = db.session.execute(
            db.select(StudentExamComment).where(
                StudentExamComment.exam_id == exam_id, StudentExamComment.student_id == student_id
            )
        ).scalar_one_or_none()
        if existing:
            existing.comment    = comment
            existing.teacher_id = teacher_id
        else:
            db.session.add(StudentExamComment(exam_id=exam_id, student_id=student_id, teacher_id=teacher_id, comment=comment))


class StudentAnswerRepository:
    def has_submitted(self, student_id: int, exam_id: int) -> bool:
        from models.student import StudentAnswer
        row = db.session.execute(
            db.select(StudentAnswer).where(
                StudentAnswer.student_id == student_id, StudentAnswer.exam_id == exam_id
            ).limit(1)
        ).scalar_one_or_none()
        return row is not None

    def submit(self, student_id: int, exam_id: int, answers_data: list, time_spent: int) -> dict:
        from models.student import StudentAnswer
        correct_ids_rows = db.session.execute(
            db.select(Answer.id)
            .join(Question, Answer.question_id == Question.id)
            .where(Question.exam_id == exam_id, Answer.is_correct == 1)
        ).scalars().all()
        correct_ids = set(correct_ids_rows)

        total = db.session.execute(
            db.select(db.func.count()).select_from(Question).where(Question.exam_id == exam_id)
        ).scalar()

        score_count = 0
        for item in answers_data:
            answer_id = item.get("answerId")
            if answer_id in correct_ids:
                score_count += 1
            db.session.add(StudentAnswer(student_id=student_id, exam_id=exam_id, answer_id=answer_id, time_spent=time_spent))

        return {"score": round(score_count / total * 10, 1) if total else 0, "correct": score_count, "total": total}
