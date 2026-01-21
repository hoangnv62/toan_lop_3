from flask import Blueprint, render_template, request, jsonify, session
from utils import get_db  # Import helper

exam_bp = Blueprint("exam", __name__)


# LẤY THÔNG TIN ĐỀ THI
@exam_bp.route("/api/exams/<int:exam_id>", methods=["GET"])
def get_exam(exam_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    sql = """
        SELECT 
            q.id AS questionId, 
            q.content AS questionContent, 
            q.svg_code AS svgCode,
            q.explanation AS explanation,
            a.id AS answerId,
            a.content AS answerContent,
            a.isCorrected AS isCorrected
        FROM questions q
        LEFT JOIN answers a ON q.id = a.questionId
        WHERE q.exam_id = %s
        ORDER BY q.id
    """

    cur.execute(sql, (exam_id,))
    rows = cur.fetchall()
    cur.execute("SELECT * FROM exams WHERE id=%s", (exam_id,))
    exam = cur.fetchone()
    conn.close()

    questions_map = {}
    for row in rows:
        qid = row["questionId"]

        if qid not in questions_map:
            questions_map[qid] = {
                "questionId": qid,
                "questionContent": row["questionContent"],
                "svgCode": row["svgCode"],
                "explanation": row["explanation"],
                "answers": [],
            }

        if row["answerId"] is not None:
            questions_map[qid]["answers"].append(
                {
                    "answerId": row["answerId"],
                    "content": row["answerContent"],
                    "isCorrected": row["isCorrected"],
                }
            )
    questions = list(questions_map.values())

    return jsonify(
        {
            "status": "success",
            "data": {
                "name": exam["name"],
                "description": exam["description"],
                "dateCreated": exam["date_created"],
                "questions": questions,
            },
        }
    )


# Tạo đề thi mới cho bài học
@exam_bp.route("/api/lessons/<int:lesson_id>/exams", methods=["POST"])
def create_exam(lesson_id):
    data = request.get_json()

    name = data.get("name")
    description = data.get("description")
    questions = data.get("questions", [])

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    try:
        # 1. Insert EXAM
        cur.execute(
            """
            INSERT INTO exams(lesson_id, name, description)
            VALUES(%s,%s,%s)
            """,
            (lesson_id, name, description),
        )
        exam_id = cur.lastrowid

        # 2. Insert QUESTIONS + ANSWERS
        for q in questions:
            content = q.get("questionContent")
            explanation = q.get("explanation")

            cur.execute(
                """
                INSERT INTO questions(exam_id, content, explanation)
                VALUES(%s,%s,%s)
                """,
                (exam_id, content, explanation),
            )
            q_id = cur.lastrowid

            for a in q.get("answers", []):
                a_content = a.get("content")
                is_correct = 1 if a.get("isCorrected") else 0

                cur.execute(
                    """
                    INSERT INTO answers(questionId, content, isCorrected)
                    VALUES(%s,%s,%s)
                    """,
                    (q_id, a_content, is_correct),
                )

        conn.commit()
        return {"message": "Tạo bài kiểm tra thành công", "examId": exam_id}

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500


# Cập nhật đề thi cho bài học
@exam_bp.route("/api/lessons/<int:lesson_id>/exams/<int:exam_id>", methods=["PUT"])
def update_exam(lesson_id, exam_id):
    data = request.get_json()

    name = data.get("name")
    description = data.get("description")
    questions = data.get("questions", [])

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    try:
        # 0. Update EXAM
        cur.execute(
            """
            UPDATE exams
            SET name=%s, description=%s
            WHERE id=%s AND lesson_id=%s
            """,
            (name, description, exam_id, lesson_id),
        )

        # 1. Lấy toàn bộ question hiện có trong DB
        cur.execute("SELECT id FROM questions WHERE exam_id=%s", (exam_id,))
        db_q_ids = {row["id"] for row in cur.fetchall()}
        client_q_ids = set()

        for q in questions:
            q_id = q.get("questionId")
            content = q.get("questionContent")
            explanation = q.get("explanation")

            # -------- QUESTION --------
            if q_id:  # update
                cur.execute(
                    """
                    UPDATE questions
                    SET content=%s, explanation=%s
                    WHERE id=%s AND exam_id=%s
                    """,
                    (content, explanation, q_id, exam_id),
                )
            else:  # insert
                cur.execute(
                    """
                    INSERT INTO questions(exam_id, content, explanation)
                    VALUES(%s,%s,%s)
                    """,
                    (exam_id, content, explanation),
                )
                q_id = cur.lastrowid

            client_q_ids.add(q_id)

            # -------- ANSWERS --------
            cur.execute("SELECT id FROM answers WHERE questionId=%s", (q_id,))
            db_a_ids = {row["id"] for row in cur.fetchall()}
            client_a_ids = set()

            for a in q.get("answers", []):
                a_id = a.get("answerId")
                a_content = a.get("content")
                is_correct = 1 if a.get("isCorrected") else 0

                if a_id:  # update
                    cur.execute(
                        """
                        UPDATE answers
                        SET content=%s, isCorrected=%s
                        WHERE id=%s AND questionId=%s
                        """,
                        (a_content, is_correct, a_id, q_id),
                    )
                else:  # insert
                    cur.execute(
                        """
                        INSERT INTO answers(questionId, content, isCorrected)
                        VALUES(%s,%s,%s)
                        """,
                        (q_id, a_content, is_correct),
                    )
                    a_id = cur.lastrowid

                client_a_ids.add(a_id)

            # delete answers removed on client
            remove_a_ids = db_a_ids - client_a_ids
            if remove_a_ids:
                cur.execute(
                    f"DELETE FROM answers WHERE id IN ({','.join(['%s']*len(remove_a_ids))})",
                    tuple(remove_a_ids),
                )

        # delete questions removed on client
        remove_q_ids = db_q_ids - client_q_ids
        if remove_q_ids:
            cur.execute(
                f"DELETE FROM questions WHERE id IN ({','.join(['%s']*len(remove_q_ids))})",
                tuple(remove_q_ids),
            )

        conn.commit()
        return {"message": "Cập nhật bài kiểm tra thành công"}

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}, 500


# HỌC SINH NỘP BÀI THI
@exam_bp.route("/api/student/submit", methods=["POST"])
def submit_exam():
    try:
        data = request.get_json()

        exam_id = data.get("examId")
        answers = data.get("answers")  # { questionId : answerId }
        time_spent = data.get("timeSpent")
        user_id = session.get("user_id")

        if not exam_id or not answers or not user_id:
            return jsonify({"status": "error", "msg": "Thiếu dữ liệu"}), 400

        conn = get_db()
        cur = conn.cursor(dictionary=True)

        # 1. Chống nộp trùng
        cur.execute(
            "SELECT 1 FROM student_answer WHERE exam_id=%s AND user_id=%s LIMIT 1",
            (exam_id, user_id),
        )
        if cur.fetchone():
            return jsonify({"status": "error", "msg": "Bạn đã nộp bài rồi!"}), 400

        # 2. Lấy danh sách đáp án đúng
        cur.execute(
            """
            SELECT id 
            FROM answers 
            WHERE questionId IN (
                SELECT id FROM questions WHERE exam_id=%s
            ) AND isCorrected = true
        """,
            (exam_id,),
        )
        correct_answers = {row["id"] for row in cur.fetchall()}

        score = 0
        total = len(correct_answers)

        insert_sql = """
            INSERT INTO student_answer (exam_id, answer_id, user_id, time_spent)
            VALUES (%s, %s, %s, %s)
        """

        # 3. Lưu + chấm điểm
        for qid, answer_id in answers.items():
            if answer_id in correct_answers:
                score += 1
            cur.execute(insert_sql, (exam_id, answer_id, user_id, time_spent))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"status": "success", "score": score, "total": total})

    except Exception as e:
        print("Submit exam error:", e)
        return jsonify({"status": "error", "msg": str(e)}), 500


# lấy danh sách đề thi theo bài học
@exam_bp.route("/api/lesson/<int:lesson_id>", methods=["GET"])
def get_exams(lesson_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM exams WHERE lesson_id=%s", (lesson_id,))
    exams = cur.fetchall()
    conn.close()
    return jsonify(exams)


@exam_bp.route("/api/student/exam-result/<int:exam_id>", methods=["GET"])
def get_exam_result(exam_id):
    uid = session.get("user_id")

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    # 1. Lấy info chung của bài thi
    cur.execute(
        """
        SELECT 
            e.name       AS exam_name,
            l.title      AS lesson_name,
            MAX(sa.time_spent)    AS time_spent,
            MAX(sa.date_created)  AS submitted_at
        FROM exams e
        JOIN lessons l ON e.lesson_id = l.id
        LEFT JOIN student_answer sa 
            ON sa.exam_id = e.id AND sa.user_id = %s
        WHERE e.id = %s
        GROUP BY e.id
    """,
        (uid, exam_id),
    )
    exam_info = cur.fetchone()

    # 2. Lấy chi tiết câu hỏi + đáp án
    cur.execute(
        """
        SELECT 
            q.id          AS question_id,
            q.content     AS question_content,
            q.explanation AS question_explanation,
            a.id          AS answer_id,
            a.content     AS answer_content,
            a.isCorrected AS is_correct,
            sa.answer_id  AS student_answer_id
        FROM questions q
        JOIN answers a ON a.questionId = q.id
        LEFT JOIN student_answer sa 
               ON sa.answer_id = a.id 
              AND sa.user_id = %s
              AND sa.exam_id = %s
        WHERE q.exam_id = %s
        ORDER BY q.id, a.id
    """,
        (uid, exam_id, exam_id),
    )
    rows = cur.fetchall()
    conn.close()

    # 3. Build JSON
    question_map = {}
    for r in rows:
        qid = r["question_id"]
        if qid not in question_map:
            question_map[qid] = {
                "id": qid,
                "content": r["question_content"],
                "explanation": r["question_explanation"],
                "answers": [],
            }

        question_map[qid]["answers"].append(
            {
                "id": r["answer_id"],
                "content": r["answer_content"],
                "is_correct": bool(r["is_correct"]),
                "is_selected": r["student_answer_id"] == r["answer_id"],
            }
        )

    return jsonify(
        {
            "exam_name": exam_info["exam_name"],
            "lesson_name": exam_info["lesson_name"],
            "time_spent": exam_info["time_spent"] or 0,
            "submitted_at": exam_info["submitted_at"],
            "questions": list(question_map.values()),
        }
    )


@exam_bp.route("/api/exams/<int:exam_id>", methods=["DELETE"])
def delete_exam(exam_id):
    conn = get_db()
    try:
        cur = conn.cursor()

        # Kiểm tra exam tồn tại (tùy chọn, để return 404 nếu không tìm thấy)
        cur.execute("SELECT 1 FROM exams WHERE id = %s", (exam_id,))
        if not cur.fetchone():
            return jsonify({"status": "error", "message": "Exam not found"}), 404

        # Xóa student_answers dựa trên subquery (qua answers và questions)
        cur.execute(
            "DELETE sa FROM student_answer sa "
            "WHERE sa.answer_id IN ("
            "    SELECT a.id FROM answers a "
            "    JOIN questions q ON a.questionId = q.id "
            "    WHERE q.exam_id = %s"
            ")",
            (exam_id,),
        )

        # Xóa answers dựa trên subquery (qua questions)
        cur.execute(
            "DELETE a FROM answers a "
            "WHERE a.questionId IN ("
            "    SELECT q.id FROM questions q WHERE q.exam_id = %s"
            ")",
            (exam_id,),
        )

        # Xóa questions trực tiếp
        cur.execute("DELETE FROM questions WHERE exam_id = %s", (exam_id,))

        # Xóa exam
        cur.execute("DELETE FROM exams WHERE id = %s", (exam_id,))

        conn.commit()
        return jsonify({"status": "success"})

    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        cur.close()
        conn.close()
