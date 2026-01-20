from flask import Blueprint, render_template, request, jsonify, session
from utils import get_db  # Import helper

classes_bp = Blueprint("classes", __name__)


# Thêm lớp học mới
@classes_bp.route("/api/classes", methods=["POST"])
def add_class():
    uid = session.get("user_id")
    d = request.json
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO classes (teacher_id, class_name) VALUES (%s, %s)",
            (uid, d["class_name"]),
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "fail", "msg": str(e)})


# danh sách lớp học của giáo viên
@classes_bp.route("/api/classes", methods=["GET"])
def get_teacher_classes():
    teacher_id = session.get("user_id")
    if not teacher_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    sql = """
        SELECT
            c.id AS classId,
            c.class_name AS className,

            COUNT(DISTINCT s.id) AS totalStudents,

            -- Tổng số câu trả lời
            COUNT(sa.id) AS totalAnswers,

            -- Số câu đúng
            SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END) AS correctAnswers

        FROM classes c
        LEFT JOIN students s ON s.class_id = c.id
        LEFT JOIN student_answer sa ON sa.user_id = s.id
        LEFT JOIN answers a ON a.id = sa.answer_id

        WHERE c.teacher_id = %s
        GROUP BY c.id
        ORDER BY c.created_at DESC
    """

    cur.execute(sql, (teacher_id,))
    rows = cur.fetchall()

    result = []

    for r in rows:
        total_answers = r["totalAnswers"] or 0
        correct_answers = r["correctAnswers"] or 0

        avg_score = (
            round((correct_answers / total_answers) * 10, 2) if total_answers else None
        )
        pass_rate = (
            round((correct_answers / total_answers) * 100, 2) if total_answers else 0
        )

        # trạng thái lớp
        if pass_rate >= 70:
            status = "good"
        elif pass_rate >= 50:
            status = "warning"
        else:
            status = "bad"

        result.append(
            {
                "classId": r["classId"],
                "className": r["className"],
                "totalStudents": r["totalStudents"],
                "avgScore": avg_score,
                "passRate": pass_rate,
                "status": status,
            }
        )

    cur.close()
    conn.close()

    return jsonify(result)


# XÓA LỚP HỌC
@classes_bp.route("/api/classes/<int:class_id>", methods=["DELETE"])
def delete_class(class_id):
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor()
    # Xóa kết quả liên quan đến học sinh trong lớp
    cur.execute(
        "DELETE FROM student_answer WHERE user_id IN (SELECT id FROM students WHERE class_id=%s AND teacher_id=%s)",
        (class_id, uid),
    )

    # Xóa học sinh trong lớp trước (để tránh vi phạm foreign key nếu có)
    cur.execute(
        "DELETE FROM students WHERE class_id=%s AND teacher_id=%s", (class_id, uid)
    )

    # Xóa lớp
    cur.execute("DELETE FROM classes WHERE id=%s AND teacher_id=%s", (class_id, uid))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@classes_bp.route("/api/class/<int:class_id>/students", methods=["GET"])
def class_students_avg_score(class_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    # 1. Lấy teacher của class (bảo mật)
    cur.execute("SELECT teacher_id FROM classes WHERE id = %s", (class_id,))
    cls = cur.fetchone()
    if not cls:
        conn.close()
        return jsonify([])

    teacher_id = cls["teacher_id"]

    # 2. Query tính điểm trung bình từng học sinh
    sql = """
        SELECT 
            s.id   AS student_id,
            s.name AS student_name,

            COUNT(DISTINCT q.id)                                   AS total_questions,
            SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END)     AS correct_questions
        FROM students s
        LEFT JOIN student_answer sa ON sa.user_id = s.id
        LEFT JOIN answers a ON sa.answer_id = a.id
        LEFT JOIN questions q ON a.questionId = q.id
        WHERE s.teacher_id = %s
        GROUP BY s.id
        ORDER BY student_name
    """
    cur.execute(sql, (teacher_id,))
    rows = cur.fetchall()
    conn.close()

    # 3. Tính điểm trung bình (Python)
    result = []
    for r in rows:
        total = r["total_questions"] or 0
        correct = r["correct_questions"] or 0
        avg = round((correct / total) * 10, 2) if total > 0 else 0

        result.append(
            {"id": r["student_id"], "name": r["student_name"], "avg_score": avg}
        )

    return jsonify(result)


@classes_bp.route("/api/classes/<int:class_id>", methods=["PUT"])
def update_class_name(class_id):
    teacher_id = session.get("user_id")
    if not teacher_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    new_name = data.get("className", "").strip()

    if not new_name:
        return jsonify({"error": "Class name required"}), 400

    conn = get_db()
    cur = conn.cursor()

    # đảm bảo giáo viên chỉ sửa lớp của mình
    cur.execute(
        """
        UPDATE classes
        SET class_name = %s
        WHERE id = %s AND teacher_id = %s
        """,
        (new_name, class_id, teacher_id),
    )

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"success": True})


@classes_bp.route("/api/classes/<int:class_id>", methods=["GET"])
def get_class_detail(class_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    # Thông tin lớp
    cur.execute(
        """
        SELECT id, class_name
        FROM classes
        WHERE id = %s
    """,
        (class_id,),
    )
    cls = cur.fetchone()

    # Danh sách học sinh + điểm TB
    cur.execute(
        """
        SELECT
            s.id,
            s.full_name,
            s.dob,
            s.parent_name,
            s.parent_phone,
            ROUND(AVG(exam_score), 2) AS avg_score
        FROM students s
        LEFT JOIN (
            SELECT
                sa.user_id,
                sa.exam_id,
                SUM(a.isCorrected) / COUNT(sa.id) * 10 AS exam_score
            FROM student_answer sa
            JOIN answers a ON a.id = sa.answer_id
            GROUP BY sa.user_id, sa.exam_id
        ) t ON t.user_id = s.id
        WHERE s.class_id = %s
        GROUP BY s.id
    """,
        (class_id,),
    )

    students = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(
        {
            "classId": cls["id"],
            "className": cls["class_name"],
            "totalStudents": len(students),
            "students": students,
        }
    )
