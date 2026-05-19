import pandas as pd
from io import BytesIO
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, g
from utils import get_db, require_auth

student_bp = Blueprint("student", __name__)


# ─── Tìm kiếm học sinh theo username ─────────────────────────────────────────

@student_bp.route("/api/students/search", methods=["GET"])
@require_auth
def search_students():
    q = request.args.get("q", "").strip()
    class_id = request.args.get("class_id", type=int)
    if not q:
        return jsonify({"success": True, "data": []})

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT u.id, u.username, u.full_name, u.dob,
               u.class_id, c.class_name AS current_class,
               sp.parent_name, sp.parent_phone
        FROM users u
        LEFT JOIN classes c ON c.id=u.class_id
        LEFT JOIN student_parents sp ON sp.student_id=u.id
        WHERE u.role='student' AND u.username LIKE %s
        LIMIT 20
        """,
        (f"%{q}%",),
    )
    students = cur.fetchall()
    cur.close(); conn.close()

    # Đánh dấu những học sinh đã trong lớp hiện tại
    for s in students:
        s["already_in_class"] = (class_id is not None and s["class_id"] == class_id)

    return jsonify({"success": True, "data": students})


# ─── Thêm học sinh vào lớp (theo username) ───────────────────────────────────

@student_bp.route("/api/classes/<int:class_id>/students", methods=["POST"])
@require_auth
def assign_student_to_class(class_id):
    uid = g.user["user_id"]
    username = (request.json or {}).get("username", "").strip()
    if not username:
        return jsonify({"success": False, "message": "Thiếu username học sinh"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    # Xác minh lớp thuộc về giáo viên này
    cur.execute("SELECT id FROM classes WHERE id=%s AND teacher_id=%s", (class_id, uid))
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Lớp không tồn tại"}), 404

    cur.execute("SELECT id, full_name, class_id FROM users WHERE username=%s AND role='student'", (username,))
    student = cur.fetchone()
    if not student:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": f'Không tìm thấy học sinh "{username}"'}), 404

    if student["class_id"] == class_id:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Học sinh đã trong lớp này"}), 409

    cur.execute("UPDATE users SET class_id=%s WHERE id=%s", (class_id, student["id"]))
    conn.commit()
    cur.close(); conn.close()

    return jsonify({"success": True, "message": f'Đã thêm {student["full_name"]} vào lớp'})


# ─── Import học sinh từ Excel (cột "username") ────────────────────────────────

@student_bp.route("/api/classes/<int:class_id>/students/upload", methods=["POST"])
@require_auth
def upload_students(class_id):
    uid = g.user["user_id"]

    if "file" not in request.files:
        return jsonify({"success": False, "message": "Không tìm thấy file"}), 400

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        return jsonify({"success": False, "message": "Chỉ hỗ trợ file .xlsx hoặc .xls"}), 400

    # Xác minh lớp thuộc về giáo viên này
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id FROM classes WHERE id=%s AND teacher_id=%s", (class_id, uid))
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Lớp không tồn tại"}), 404

    try:
        df = pd.read_excel(BytesIO(file.read()))
        df.columns = df.columns.str.strip().str.lower()

        if "username" not in df.columns:
            cur.close(); conn.close()
            return jsonify({"success": False, "message": "File thiếu cột: username"}), 400

        success_count = 0
        errors = []

        for _, row in df.iterrows():
            username = str(row["username"]).strip()
            if not username or username == "nan":
                errors.append("Bỏ qua dòng trống")
                continue
            cur.execute(
                "SELECT id, full_name, class_id FROM users WHERE username=%s AND role='student'",
                (username,)
            )
            student = cur.fetchone()
            if not student:
                errors.append(f'Không tìm thấy học sinh "{username}"')
                continue
            if student["class_id"] == class_id:
                errors.append(f'"{username}" đã trong lớp này')
                continue
            cur.execute("UPDATE users SET class_id=%s WHERE id=%s", (class_id, student["id"]))
            success_count += 1

        conn.commit()
        cur.close(); conn.close()

        msg = f"Thêm thành công {success_count} học sinh."
        if errors:
            msg += f" Có {len(errors)} lỗi: " + "; ".join(errors[:3])
        return jsonify({"success": True, "message": msg, "count": success_count})

    except Exception as e:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": f"Lỗi xử lý file: {str(e)}"}), 500


# ─── Gỡ học sinh khỏi lớp (không xóa tài khoản) ─────────────────────────────

@student_bp.route("/api/classes/<int:class_id>/students/<int:student_id>", methods=["DELETE"])
@require_auth
def remove_student_from_class(class_id, student_id):
    uid = g.user["user_id"]
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT id FROM classes WHERE id=%s AND teacher_id=%s", (class_id, uid))
        if not cur.fetchone():
            return jsonify({"success": False, "message": "Lớp không tồn tại"}), 404

        cur.execute(
            "UPDATE users SET class_id=NULL WHERE id=%s AND class_id=%s AND role='student'",
            (student_id, class_id)
        )
        conn.commit()
        return jsonify({"success": True, "message": "Đã gỡ học sinh khỏi lớp"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


# ─── Kết quả thi của học sinh ─────────────────────────────────────────────────

@student_bp.route("/api/students/<int:student_id>/results", methods=["GET"])
@require_auth
def student_results(student_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT full_name FROM users WHERE id=%s AND role='student'", (student_id,))
    student = cur.fetchone()
    if not student:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Học sinh không tồn tại"}), 404

    cur.execute(
        """
        SELECT e.id AS examId, e.name AS examName, l.title AS lessonName,
            ROUND(
                SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END)
                / NULLIF(COUNT(DISTINCT q.id),0) * 10
            , 1) AS score,
            MAX(sa.submitted_at) AS submittedAt
        FROM student_answers sa
        JOIN answers  a ON sa.answer_id=a.id
        JOIN questions q ON a.question_id=q.id
        JOIN exams e ON sa.exam_id=e.id
        JOIN lessons l ON e.lesson_id=l.id
        WHERE sa.student_id=%s
        GROUP BY sa.exam_id
        ORDER BY MAX(sa.submitted_at) DESC
        """,
        (student_id,),
    )
    results = cur.fetchall()
    cur.close(); conn.close()

    return jsonify({"success": True, "data": {
        "studentName": student["full_name"],
        "results": results,
    }})


# ─── Dashboard học sinh ───────────────────────────────────────────────────────

def _parse_date(s):
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None


@student_bp.route("/api/dashboard/student", methods=["GET"])
@require_auth
def student_dashboard():
    uid = g.user["user_id"]
    date_from = _parse_date(request.args.get("dateFrom", ""))
    date_to   = _parse_date(request.args.get("dateTo", ""))

    if date_from and date_to and date_from > date_to:
        return jsonify({"success": False, "message": "dateFrom phải nhỏ hơn hoặc bằng dateTo"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    # Lấy teacher_id qua class
    cur.execute(
        "SELECT c.teacher_id FROM users u JOIN classes c ON u.class_id=c.id WHERE u.id=%s",
        (uid,)
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return jsonify({"success": True, "data": {
            "exams": [], "scores": [], "ranking": [],
            "progress": {"totalExams": 0, "done": 0, "avg": None},
        }})
    teacher_id = row["teacher_id"]

    lesson_rows  = _lessons_with_stats(cur, uid, teacher_id, date_from, date_to)
    ranking_rows = _class_ranking(cur, teacher_id, date_from, date_to)
    cur.close(); conn.close()

    exams  = []
    scores = []
    for r in lesson_rows:
        done = bool(r["done"])
        score = None
        if done and r["total_questions"]:
            score = round((r["correct_questions"] or 0) / r["total_questions"] * 10, 1)
        exams.append({
            "examId": r["exam_id"], "examName": r["exam_name"],
            "lessonTitle": r["lesson_name"], "done": done, "score": score,
        })
        if done and score is not None:
            scores.append({"examName": r["exam_name"], "score": score})

    done_count = sum(1 for e in exams if e["done"])
    avg = round(sum(s["score"] for s in scores) / len(scores), 1) if scores else None

    ranking = [
        {
            "studentId": r["student_id"],
            "name": r["student_name"],
            "avg": round((r["correct_questions"] or 0) / r["total_questions"] * 10, 1)
                   if r["total_questions"] else 0,
        }
        for r in ranking_rows
    ]

    return jsonify({"success": True, "data": {
        "exams": exams, "scores": scores, "ranking": ranking,
        "progress": {"totalExams": len(exams), "done": done_count, "avg": avg},
    }})


def _lessons_with_stats(cur, student_id, teacher_id, date_from=None, date_to=None):
    sql = """
        SELECT l.id AS lesson_id, l.title AS lesson_name, l.created_at,
            e.id AS exam_id, e.name AS exam_name,
            CASE WHEN MAX(sa.id) IS NULL THEN 0 ELSE 1 END AS done,
            COUNT(DISTINCT q.id) AS total_questions,
            SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct_questions,
            MAX(sa.time_spent) AS time_spent
        FROM lessons l
        JOIN exams e ON e.lesson_id=l.id
        LEFT JOIN student_answers sa ON sa.exam_id=e.id AND sa.student_id=%s
        LEFT JOIN answers a ON sa.answer_id=a.id
        LEFT JOIN questions q ON a.question_id=q.id
        WHERE l.teacher_id=%s
    """
    params = [student_id, teacher_id]
    if date_from:
        sql += " AND (sa.submitted_at IS NULL OR sa.submitted_at >= %s)"
        params.append(date_from)
    if date_to:
        sql += " AND (sa.submitted_at IS NULL OR sa.submitted_at < %s)"
        params.append(date_to + timedelta(days=1))
    sql += " GROUP BY l.id, e.id ORDER BY l.created_at DESC"
    cur.execute(sql, tuple(params))
    return cur.fetchall()


def _class_ranking(cur, teacher_id, date_from=None, date_to=None):
    sql = """
        SELECT u.id AS student_id, u.full_name AS student_name,
            COUNT(DISTINCT q.id) AS total_questions,
            SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct_questions
        FROM users u
        LEFT JOIN student_answers sa ON sa.student_id=u.id
        LEFT JOIN answers a ON sa.answer_id=a.id
        LEFT JOIN questions q ON a.question_id=q.id
        WHERE u.class_id IN (SELECT id FROM classes WHERE teacher_id=%s)
          AND u.role='student'
    """
    params = [teacher_id]
    if date_from:
        sql += " AND (sa.submitted_at IS NULL OR sa.submitted_at >= %s)"
        params.append(date_from)
    if date_to:
        sql += " AND (sa.submitted_at IS NULL OR sa.submitted_at < %s)"
        params.append(date_to + timedelta(days=1))
    sql += " GROUP BY u.id ORDER BY correct_questions DESC"
    cur.execute(sql, tuple(params))
    return cur.fetchall()
