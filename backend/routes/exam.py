from flask import Blueprint, request, jsonify, g
from utils import get_db, require_auth

exam_bp = Blueprint("exam", __name__)


@exam_bp.route("/api/exams/<int:exam_id>", methods=["GET"])
@require_auth
def get_exam(exam_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT * FROM exams WHERE id=%s", (exam_id,))
    exam = cur.fetchone()
    if not exam:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Bài thi không tồn tại"}), 404

    cur.execute(
        """
        SELECT q.id AS questionId, q.content AS questionContent,
               q.svg_code AS svgCode, q.explanation,
               a.id AS answerId, a.content AS answerContent, a.is_correct AS isCorrected
        FROM questions q
        LEFT JOIN answers a ON q.id=a.question_id
        WHERE q.exam_id=%s ORDER BY q.id, a.id
        """,
        (exam_id,),
    )
    rows = cur.fetchall()
    cur.close(); conn.close()

    questions_map = {}
    for row in rows:
        qid = row["questionId"]
        if qid not in questions_map:
            questions_map[qid] = {
                "questionId":      qid,
                "questionContent": row["questionContent"],
                "svgCode":         row["svgCode"],
                "explanation":     row["explanation"],
                "answers":         [],
            }
        if row["answerId"] is not None:
            questions_map[qid]["answers"].append({
                "answerId":   row["answerId"],
                "content":    row["answerContent"],
                "isCorrected": row["isCorrected"],
            })

    return jsonify({"success": True, "data": {
        "name":        exam["name"],
        "description": exam["description"],
        "dateCreated": exam["date_created"],
        "questions":   list(questions_map.values()),
    }})


@exam_bp.route("/api/lessons/<int:lesson_id>/exams", methods=["POST"])
@require_auth
def create_exam(lesson_id):
    data = request.get_json() or {}
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "INSERT INTO exams(lesson_id, name, description) VALUES(%s,%s,%s)",
            (lesson_id, data.get("name"), data.get("description")),
        )
        exam_id = cur.lastrowid
        for q in data.get("questions", []):
            cur.execute(
                "INSERT INTO questions(exam_id, content, explanation) VALUES(%s,%s,%s)",
                (exam_id, q.get("questionContent"), q.get("explanation")),
            )
            q_id = cur.lastrowid
            for a in q.get("answers", []):
                cur.execute(
                    "INSERT INTO answers(question_id, content, is_correct) VALUES(%s,%s,%s)",
                    (q_id, a.get("content"), 1 if a.get("isCorrected") else 0),
                )
        conn.commit()
        return jsonify({"success": True, "message": "Tạo bài kiểm tra thành công", "examId": exam_id})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@exam_bp.route("/api/lessons/<int:lesson_id>/exams/<int:exam_id>", methods=["PUT"])
@require_auth
def update_exam(lesson_id, exam_id):
    data = request.get_json() or {}
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "UPDATE exams SET name=%s, description=%s WHERE id=%s AND lesson_id=%s",
            (data.get("name"), data.get("description"), exam_id, lesson_id),
        )
        cur.execute("SELECT id FROM questions WHERE exam_id=%s", (exam_id,))
        db_q_ids = {row["id"] for row in cur.fetchall()}
        client_q_ids = set()

        for q in data.get("questions", []):
            q_id = q.get("questionId")
            if q_id:
                cur.execute(
                    "UPDATE questions SET content=%s, explanation=%s WHERE id=%s AND exam_id=%s",
                    (q.get("questionContent"), q.get("explanation"), q_id, exam_id),
                )
            else:
                cur.execute(
                    "INSERT INTO questions(exam_id, content, explanation) VALUES(%s,%s,%s)",
                    (exam_id, q.get("questionContent"), q.get("explanation")),
                )
                q_id = cur.lastrowid
            client_q_ids.add(q_id)

            cur.execute("SELECT id FROM answers WHERE question_id=%s", (q_id,))
            db_a_ids     = {row["id"] for row in cur.fetchall()}
            client_a_ids = set()

            for a in q.get("answers", []):
                a_id       = a.get("answerId")
                is_correct = 1 if a.get("isCorrected") else 0
                if a_id:
                    cur.execute(
                        "UPDATE answers SET content=%s, is_correct=%s WHERE id=%s AND question_id=%s",
                        (a.get("content"), is_correct, a_id, q_id),
                    )
                else:
                    cur.execute(
                        "INSERT INTO answers(question_id, content, is_correct) VALUES(%s,%s,%s)",
                        (q_id, a.get("content"), is_correct),
                    )
                    a_id = cur.lastrowid
                client_a_ids.add(a_id)

            stale_answers = db_a_ids - client_a_ids
            if stale_answers:
                cur.execute(
                    f"DELETE FROM answers WHERE id IN ({','.join(['%s']*len(stale_answers))})",
                    tuple(stale_answers),
                )

        stale_questions = db_q_ids - client_q_ids
        if stale_questions:
            cur.execute(
                f"DELETE FROM questions WHERE id IN ({','.join(['%s']*len(stale_questions))})",
                tuple(stale_questions),
            )

        conn.commit()
        return jsonify({"success": True, "message": "Cập nhật bài kiểm tra thành công"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@exam_bp.route("/api/exams/<int:exam_id>", methods=["DELETE"])
@require_auth
def delete_exam(exam_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT 1 FROM exams WHERE id=%s", (exam_id,))
        if not cur.fetchone():
            return jsonify({"success": False, "message": "Bài thi không tồn tại"}), 404

        cur.execute(
            "DELETE sa FROM student_answers sa "
            "WHERE sa.answer_id IN ("
            "  SELECT a.id FROM answers a "
            "  JOIN questions q ON a.question_id=q.id WHERE q.exam_id=%s"
            ")",
            (exam_id,),
        )
        cur.execute(
            "DELETE a FROM answers a "
            "WHERE a.question_id IN (SELECT q.id FROM questions q WHERE q.exam_id=%s)",
            (exam_id,),
        )
        cur.execute("DELETE FROM questions WHERE exam_id=%s", (exam_id,))
        cur.execute("DELETE FROM exams WHERE id=%s", (exam_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Đã xóa bài thi"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@exam_bp.route("/api/exams/<int:exam_id>/submit", methods=["POST"])
@require_auth
def submit_exam(exam_id):
    conn = None
    cur  = None
    try:
        data       = request.get_json() or {}
        answers    = data.get("answers", [])
        time_spent = data.get("timeSpent", 0)
        student_id = g.user["user_id"]

        if not answers:
            return jsonify({"success": False, "message": "Thiếu dữ liệu câu trả lời"}), 400

        conn = get_db()
        cur  = conn.cursor(dictionary=True)

        cur.execute(
            "SELECT 1 FROM student_answers WHERE exam_id=%s AND student_id=%s LIMIT 1",
            (exam_id, student_id),
        )
        if cur.fetchone():
            return jsonify({"success": False, "message": "Bạn đã nộp bài rồi!"}), 409

        cur.execute(
            "SELECT id FROM answers WHERE question_id IN "
            "(SELECT id FROM questions WHERE exam_id=%s) AND is_correct=1",
            (exam_id,),
        )
        correct_ids = {row["id"] for row in cur.fetchall()}

        cur.execute("SELECT COUNT(*) AS total FROM questions WHERE exam_id=%s", (exam_id,))
        total = cur.fetchone()["total"]

        score_count = 0
        for item in answers:
            answer_id = item.get("answerId")
            if answer_id in correct_ids:
                score_count += 1
            cur.execute(
                "INSERT INTO student_answers (exam_id, answer_id, student_id, time_spent) VALUES(%s,%s,%s,%s)",
                (exam_id, answer_id, student_id, time_spent),
            )

        conn.commit()
        score = round(score_count / total * 10, 1) if total else 0
        return jsonify({"success": True, "data": {"score": score, "correct": score_count, "total": total}})

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cur:  cur.close()
        if conn: conn.close()


@exam_bp.route("/api/exams/<int:exam_id>/result", methods=["GET"])
@require_auth
def get_exam_result(exam_id):
    uid = g.user["user_id"]
    conn = get_db()
    cur  = conn.cursor(dictionary=True)

    cur.execute(
        """
        SELECT e.name AS exam_name, l.title AS lesson_name,
               MAX(sa.time_spent) AS time_spent,
               MAX(sa.submitted_at) AS submitted_at
        FROM exams e
        JOIN lessons l ON e.lesson_id=l.id
        LEFT JOIN student_answers sa ON sa.exam_id=e.id AND sa.student_id=%s
        WHERE e.id=%s GROUP BY e.id
        """,
        (uid, exam_id),
    )
    exam_info = cur.fetchone()
    if not exam_info:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Bài thi không tồn tại"}), 404

    cur.execute(
        """
        SELECT q.id AS question_id, q.content AS question_content, q.explanation,
               a.id AS answer_id, a.content AS answer_content,
               a.is_correct, sa.answer_id AS student_answer_id
        FROM questions q
        JOIN answers a ON a.question_id=q.id
        LEFT JOIN student_answers sa ON sa.answer_id=a.id AND sa.student_id=%s AND sa.exam_id=%s
        WHERE q.exam_id=%s ORDER BY q.id, a.id
        """,
        (uid, exam_id, exam_id),
    )
    rows = cur.fetchall()
    cur.close(); conn.close()

    question_map = {}
    for r in rows:
        qid = r["question_id"]
        if qid not in question_map:
            question_map[qid] = {
                "questionId":       qid,
                "questionContent":  r["question_content"],
                "explanation":      r["explanation"],
                "isCorrect":        False,
                "selectedAnswerId": None,
                "answers":          [],
            }
        ans = {
            "answerId":   r["answer_id"],
            "content":    r["answer_content"],
            "isCorrected": r["is_correct"],
            "isSelected":  r["student_answer_id"] == r["answer_id"],
        }
        if ans["isSelected"]:
            question_map[qid]["selectedAnswerId"] = r["answer_id"]
        question_map[qid]["answers"].append(ans)

    questions    = list(question_map.values())
    correct_count = 0
    for q in questions:
        correct_ans = next((a for a in q["answers"] if a["isCorrected"] == 1), None)
        q["isCorrect"] = (
            correct_ans is not None and q["selectedAnswerId"] == correct_ans["answerId"]
        )
        if q["isCorrect"]:
            correct_count += 1

    score = round(correct_count / len(questions) * 10, 1) if questions else 0

    return jsonify({"success": True, "data": {
        "examName":    exam_info["exam_name"],
        "lessonName":  exam_info["lesson_name"],
        "timeSpent":   exam_info["time_spent"] or 0,
        "submittedAt": str(exam_info["submitted_at"]) if exam_info["submitted_at"] else None,
        "score":       score,
        "correct":     correct_count,
        "total":       len(questions),
        "questions":   questions,
    }})


@exam_bp.route("/api/exams/<int:exam_id>/stats", methods=["GET"])
@require_auth
def get_exam_stats(exam_id):
    conn = get_db()
    cur  = conn.cursor(dictionary=True)

    cur.execute("SELECT name, lesson_id FROM exams WHERE id=%s", (exam_id,))
    exam = cur.fetchone()
    if not exam:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Bài thi không tồn tại"}), 404

    cur.execute(
        """
        SELECT sa.student_id,
            ROUND(
                SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END)
                / NULLIF(COUNT(DISTINCT q.id),0) * 10
            , 1) AS score
        FROM student_answers sa
        JOIN answers a ON sa.answer_id=a.id
        JOIN questions q ON a.question_id=q.id
        WHERE sa.exam_id=%s
        GROUP BY sa.student_id
        """,
        (exam_id,),
    )
    scores = [float(row["score"] or 0) for row in cur.fetchall()]

    cur.execute(
        """
        SELECT COUNT(DISTINCT u.id) AS total
        FROM users u
        JOIN classes c ON u.class_id=c.id
        WHERE c.teacher_id=(SELECT teacher_id FROM lessons WHERE id=%s)
          AND u.role='student'
        """,
        (exam["lesson_id"],),
    )
    total_row = cur.fetchone()
    cur.close(); conn.close()

    total_students = total_row["total"] if total_row else 0
    dist = {"0-4": 0, "4-6": 0, "6-8": 0, "8-10": 0}
    for s in scores:
        if s < 4:   dist["0-4"] += 1
        elif s < 6: dist["4-6"] += 1
        elif s < 8: dist["6-8"] += 1
        else:       dist["8-10"] += 1

    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return jsonify({"success": True, "data": {
        "examName":          exam["name"],
        "totalStudents":     total_students,
        "completedStudents": len(scores),
        "avgScore":          avg_score,
        "distribution":      dist,
    }})
