from flask import Blueprint, request, jsonify, g
from utils import get_db, require_auth

classes_bp = Blueprint("classes", __name__)


@classes_bp.route("/api/classes", methods=["POST"])
@require_auth
def add_class():
    uid = g.user["user_id"]
    class_name = (request.json or {}).get("class_name", "").strip()
    if not class_name:
        return jsonify({"success": False, "message": "Tên lớp không được trống"}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO classes (teacher_id, class_name) VALUES (%s,%s)", (uid, class_name))
        conn.commit()
        return jsonify({"success": True, "message": f'Tạo lớp "{class_name}" thành công'})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@classes_bp.route("/api/classes", methods=["GET"])
@require_auth
def get_teacher_classes():
    teacher_id = g.user["user_id"]
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT
            c.id   AS classId,
            c.class_name AS className,
            COUNT(DISTINCT u.id)  AS totalStudents,
            COUNT(sa.id)          AS totalAnswers,
            SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correctAnswers
        FROM classes c
        LEFT JOIN users u  ON u.class_id=c.id AND u.role='student'
        LEFT JOIN student_answers sa ON sa.student_id=u.id
        LEFT JOIN answers a ON a.id=sa.answer_id
        WHERE c.teacher_id=%s
        GROUP BY c.id
        ORDER BY c.created_at DESC
        """,
        (teacher_id,),
    )
    rows = cur.fetchall()
    cur.close(); conn.close()

    result = []
    for r in rows:
        total   = r["totalAnswers"] or 0
        correct = r["correctAnswers"] or 0
        avg_score = round(correct / total * 10, 2) if total else None
        pass_rate = round(correct / total * 100, 2) if total else 0
        status = "good" if pass_rate >= 70 else "warning" if pass_rate >= 50 else "bad"
        result.append({
            "classId": r["classId"], "className": r["className"],
            "totalStudents": r["totalStudents"], "avgScore": avg_score,
            "passRate": pass_rate, "status": status,
        })

    return jsonify({"success": True, "data": result})


@classes_bp.route("/api/classes/<int:class_id>", methods=["GET"])
@require_auth
def get_class_detail(class_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT id, class_name FROM classes WHERE id=%s", (class_id,))
    cls = cur.fetchone()
    if not cls:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Lớp không tồn tại"}), 404

    cur.execute(
        """
        SELECT u.id, u.username, u.full_name, u.dob,
               ROUND(AVG(exam_score), 2) AS avg_score
        FROM users u
        LEFT JOIN (
            SELECT sa.student_id, sa.exam_id,
                SUM(a.is_correct) / NULLIF(COUNT(sa.id),0) * 10 AS exam_score
            FROM student_answers sa
            JOIN answers a ON a.id=sa.answer_id
            GROUP BY sa.student_id, sa.exam_id
        ) t ON t.student_id=u.id
        WHERE u.class_id=%s AND u.role='student'
        GROUP BY u.id
        """,
        (class_id,),
    )
    students = cur.fetchall()
    cur.close(); conn.close()

    return jsonify({"success": True, "data": {
        "classId": cls["id"], "className": cls["class_name"],
        "totalStudents": len(students), "students": students,
    }})


@classes_bp.route("/api/classes/<int:class_id>", methods=["PUT"])
@require_auth
def update_class(class_id):
    teacher_id = g.user["user_id"]
    new_name = (request.json or {}).get("className", "").strip()
    if not new_name:
        return jsonify({"success": False, "message": "Tên lớp không được trống"}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE classes SET class_name=%s WHERE id=%s AND teacher_id=%s",
            (new_name, class_id, teacher_id),
        )
        conn.commit()
        return jsonify({"success": True, "message": "Cập nhật thành công"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@classes_bp.route("/api/classes/<int:class_id>", methods=["DELETE"])
@require_auth
def delete_class(class_id):
    uid = g.user["user_id"]
    conn = get_db()
    cur = conn.cursor()
    try:
        # Gỡ học sinh khỏi lớp thay vì xóa tài khoản
        cur.execute(
            "UPDATE users SET class_id=NULL WHERE class_id=%s AND role='student'",
            (class_id,)
        )
        cur.execute("DELETE FROM classes WHERE id=%s AND teacher_id=%s", (class_id, uid))
        conn.commit()
        return jsonify({"success": True, "message": "Đã xóa lớp"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@classes_bp.route("/api/classes/<int:class_id>/exams", methods=["GET"])
@require_auth
def get_class_exams(class_id):
    teacher_id = g.user["user_id"]
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT id FROM classes WHERE id=%s AND teacher_id=%s", (class_id, teacher_id))
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Lớp không tồn tại"}), 404

    cur.execute(
        """
        SELECT ce.exam_id, e.name AS exam_name, l.title AS lesson_name,
               ce.deadline, ce.assigned_at,
               COUNT(DISTINCT sa.student_id) AS completed_count,
               (SELECT COUNT(*) FROM users WHERE class_id=%s AND role='student') AS total_students
        FROM class_exams ce
        JOIN exams e ON ce.exam_id=e.id
        JOIN lessons l ON e.lesson_id=l.id
        LEFT JOIN student_answers sa
            ON sa.exam_id=ce.exam_id
            AND sa.student_id IN (SELECT id FROM users WHERE class_id=%s AND role='student')
        WHERE ce.class_id=%s
        GROUP BY ce.exam_id
        ORDER BY ce.assigned_at DESC
        """,
        (class_id, class_id, class_id),
    )
    rows = cur.fetchall()
    cur.close(); conn.close()

    for r in rows:
        r["deadline"]    = str(r["deadline"])    if r["deadline"]    else None
        r["assigned_at"] = str(r["assigned_at"]) if r["assigned_at"] else None

    return jsonify({"success": True, "data": rows})


@classes_bp.route("/api/classes/<int:class_id>/exams", methods=["POST"])
@require_auth
def assign_exam_to_class(class_id):
    teacher_id = g.user["user_id"]
    data    = request.get_json() or {}
    exam_id  = data.get("exam_id")
    deadline = data.get("deadline") or None

    if not exam_id:
        return jsonify({"success": False, "message": "Thiếu exam_id"}), 400

    conn = get_db()
    cur  = conn.cursor(dictionary=True)

    cur.execute("SELECT id FROM classes WHERE id=%s AND teacher_id=%s", (class_id, teacher_id))
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Lớp không tồn tại"}), 404

    cur.execute(
        """
        SELECT e.id FROM exams e
        JOIN lessons l ON e.lesson_id=l.id
        WHERE e.id=%s AND l.teacher_id=%s
        """,
        (exam_id, teacher_id),
    )
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Bài thi không tồn tại"}), 404

    try:
        cur.execute(
            "INSERT INTO class_exams (class_id, exam_id, deadline) VALUES (%s,%s,%s)",
            (class_id, exam_id, deadline),
        )
        conn.commit()
        return jsonify({"success": True, "message": "Đã giao bài cho lớp"})
    except Exception as e:
        conn.rollback()
        if "Duplicate entry" in str(e):
            return jsonify({"success": False, "message": "Bài thi đã được giao cho lớp này"}), 409
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@classes_bp.route("/api/classes/<int:class_id>/exams/<int:exam_id>", methods=["DELETE"])
@require_auth
def unassign_exam_from_class(class_id, exam_id):
    teacher_id = g.user["user_id"]
    conn = get_db()
    cur  = conn.cursor()

    cur.execute("SELECT id FROM classes WHERE id=%s AND teacher_id=%s", (class_id, teacher_id))
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Lớp không tồn tại"}), 404

    try:
        cur.execute(
            "DELETE FROM class_exams WHERE class_id=%s AND exam_id=%s",
            (class_id, exam_id),
        )
        conn.commit()
        return jsonify({"success": True, "message": "Đã thu hồi bài thi"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@classes_bp.route("/api/classes/<int:class_id>/students", methods=["GET"])
@require_auth
def class_students_with_scores(class_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT id FROM classes WHERE id=%s", (class_id,))
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Lớp không tồn tại"}), 404

    cur.execute(
        """
        SELECT u.id, u.full_name AS name,
            ROUND(
                SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) * 10.0
                / NULLIF(COUNT(DISTINCT q.id), 0)
            , 2) AS avg_score
        FROM users u
        LEFT JOIN student_answers sa ON sa.student_id=u.id
        LEFT JOIN answers a ON sa.answer_id=a.id
        LEFT JOIN questions q ON a.question_id=q.id
        WHERE u.class_id=%s AND u.role='student'
        GROUP BY u.id ORDER BY u.full_name
        """,
        (class_id,),
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    return jsonify({"success": True, "data": rows})
