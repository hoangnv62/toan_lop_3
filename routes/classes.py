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
def get_classes():
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT * FROM classes WHERE teacher_id=%s"
    params = [uid]
    cur.execute(sql, params)
    classes = cur.fetchall()
    conn.close()
    return jsonify(classes)


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
