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
               ce.deadline, ce.assigned_at, ce.open_time,
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
        r["open_time"]   = str(r["open_time"])   if r["open_time"]   else None

    return jsonify({"success": True, "data": rows})


@classes_bp.route("/api/classes/<int:class_id>/exams", methods=["POST"])
@require_auth
def assign_exam_to_class(class_id):
    teacher_id = g.user["user_id"]
    data    = request.get_json() or {}
    exam_id  = data.get("exam_id")
    deadline = data.get("deadline") or None
    open_time = data.get("open_time") or None

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
            "INSERT INTO class_exams (class_id, exam_id, deadline, open_time) VALUES (%s,%s,%s,%s)",
            (class_id, exam_id, deadline, open_time),
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


# ── Feature 4: Announcements ──────────────────────────────────────────────────

@classes_bp.route("/api/classes/<int:class_id>/announcements", methods=["GET"])
@require_auth
def get_announcements(class_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT id, title, content, created_at FROM announcements WHERE class_id=%s ORDER BY created_at DESC",
        (class_id,),
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    for r in rows:
        r["created_at"] = str(r["created_at"]) if r["created_at"] else None
    return jsonify({"success": True, "data": rows})


@classes_bp.route("/api/classes/<int:class_id>/announcements", methods=["POST"])
@require_auth
def create_announcement(class_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403

    teacher_id = g.user["user_id"]
    data = request.get_json() or {}
    title   = data.get("title", "").strip()
    content = data.get("content", "").strip()

    if not title or not content:
        return jsonify({"success": False, "message": "Tiêu đề và nội dung không được trống"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT id FROM classes WHERE id=%s AND teacher_id=%s", (class_id, teacher_id))
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Lớp không tồn tại"}), 404

    try:
        cur.execute(
            "INSERT INTO announcements (class_id, teacher_id, title, content) VALUES (%s,%s,%s,%s)",
            (class_id, teacher_id, title, content),
        )
        conn.commit()
        new_id = cur.lastrowid
        return jsonify({"success": True, "id": new_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@classes_bp.route("/api/announcements/<int:ann_id>", methods=["DELETE"])
@require_auth
def delete_announcement(ann_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403

    teacher_id = g.user["user_id"]
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT id FROM announcements WHERE id=%s AND teacher_id=%s", (ann_id, teacher_id))
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Thông báo không tồn tại"}), 404

    try:
        cur.execute("DELETE FROM announcements WHERE id=%s", (ann_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Đã xóa thông báo"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


# ── Feature 8: Export student list to Excel ───────────────────────────────────

@classes_bp.route("/api/classes/<int:class_id>/students/export", methods=["GET"])
@require_auth
def export_students(class_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403

    import openpyxl
    from flask import Response
    from urllib.parse import quote

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT id, class_name FROM classes WHERE id=%s AND teacher_id=%s", (class_id, g.user["user_id"]))
    cls = cur.fetchone()
    if not cls:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Lớp không tồn tại"}), 404

    cur.execute(
        """
        SELECT u.username, u.full_name, u.dob,
            ROUND(AVG(CASE WHEN a.is_correct=1 THEN 10.0 ELSE 0 END), 2) AS avg_score,
            COUNT(DISTINCT sa.exam_id) AS total_exams
        FROM users u
        LEFT JOIN student_answers sa ON sa.student_id=u.id
        LEFT JOIN answers a ON sa.answer_id=a.id
        WHERE u.class_id=%s AND u.role='student'
        GROUP BY u.id ORDER BY u.full_name
        """,
        (class_id,),
    )
    students = cur.fetchall()
    cur.close(); conn.close()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Danh sách học sinh"
    ws.append(["STT", "Họ và tên", "Username", "Ngày sinh", "Điểm TB", "Số bài đã làm"])
    for i, s in enumerate(students, 1):
        ws.append([
            i,
            s["full_name"],
            s["username"],
            str(s["dob"]) if s["dob"] else "",
            float(s["avg_score"] or 0),
            int(s["total_exams"] or 0),
        ])

    from io import BytesIO
    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    safe_name = quote(cls["class_name"])
    return Response(
        buf.getvalue(),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{safe_name}.xlsx"},
    )
