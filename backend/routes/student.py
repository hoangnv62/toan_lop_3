import pandas as pd
from io import BytesIO
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, g
from utils import get_db, require_auth

student_bp = Blueprint("student", __name__)


@student_bp.route("/api/classes/<int:class_id>/students", methods=["POST"])
@require_auth
def add_student_to_class(class_id):
    uid = g.user["user_id"]
    d = request.json or {}
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO students (teacher_id, class_id, full_name, dob, parent_name, parent_phone) "
            "VALUES (%s,%s,%s,%s,%s,%s)",
            (uid, class_id, d.get("full_name"), d.get("dob") or None,
             d.get("parent_name"), d.get("parent_phone")),
        )
        conn.commit()
        return jsonify({"success": True, "message": "Thêm học sinh thành công"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@student_bp.route("/api/classes/<int:class_id>/students/upload", methods=["POST"])
@require_auth
def upload_students(class_id):
    uid = g.user["user_id"]

    if "file" not in request.files:
        return jsonify({"success": False, "message": "Không tìm thấy file"}), 400

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        return jsonify({"success": False, "message": "Chỉ hỗ trợ file .xlsx hoặc .xls"}), 400

    try:
        df = pd.read_excel(BytesIO(file.read()))
        df.columns = df.columns.str.strip().str.lower()

        required = ["tên học sinh", "tên phụ huynh", "số điện thoại phụ huynh"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            return jsonify({"success": False, "message": f'File thiếu cột: {", ".join(missing)}'}), 400

        conn = get_db()
        cur = conn.cursor()
        success_count = 0
        errors = []

        for _, row in df.iterrows():
            full_name = str(row["tên học sinh"]).strip()
            parent_name = str(row.get("tên phụ huynh", "")).strip()
            parent_phone = str(row["số điện thoại phụ huynh"]).strip()
            if not full_name or not parent_phone:
                errors.append(f"Bỏ qua: thiếu tên hoặc SĐT ({full_name})")
                continue
            try:
                cur.execute(
                    "INSERT INTO students (teacher_id, class_id, full_name, parent_name, parent_phone) "
                    "VALUES (%s,%s,%s,%s,%s)",
                    (uid, class_id, full_name, parent_name, parent_phone),
                )
                success_count += 1
            except Exception as e:
                errors.append(f"Lỗi {full_name}: {str(e)}")

        conn.commit()
        cur.close()
        conn.close()

        msg = f"Thêm thành công {success_count} học sinh."
        if errors:
            msg += f" Có {len(errors)} lỗi: " + "; ".join(errors[:3])
        return jsonify({"success": True, "message": msg, "count": success_count})

    except Exception as e:
        return jsonify({"success": False, "message": f"Lỗi xử lý file Excel: {str(e)}"}), 500


@student_bp.route("/api/students/<int:student_id>", methods=["DELETE"])
@require_auth
def delete_student(student_id):
    uid = g.user["user_id"]
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM student_answer WHERE user_id=%s", (student_id,))
        cur.execute("DELETE FROM students WHERE id=%s AND teacher_id=%s", (student_id, uid))
        conn.commit()
        return jsonify({"success": True, "message": "Đã xóa học sinh"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@student_bp.route("/api/students/<int:student_id>/results", methods=["GET"])
@require_auth
def student_results(student_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT full_name FROM students WHERE id=%s", (student_id,))
    student = cur.fetchone()
    if not student:
        cur.close()
        conn.close()
        return jsonify({"success": False, "message": "Học sinh không tồn tại"}), 404

    cur.execute(
        """
        SELECT e.id AS examId, e.name AS examName, l.title AS lessonName,
            ROUND(SUM(CASE WHEN a.isCorrected=1 THEN 1 ELSE 0 END)
                  / NULLIF(COUNT(DISTINCT q.id), 0) * 10, 1) AS score,
            MAX(sa.date_created) AS submittedAt
        FROM student_answer sa
        JOIN answers a ON sa.answer_id = a.id
        JOIN questions q ON a.questionId = q.id
        JOIN exams e ON sa.exam_id = e.id
        JOIN lessons l ON e.lesson_id = l.id
        WHERE sa.user_id = %s
        GROUP BY sa.exam_id
        ORDER BY MAX(sa.date_created) DESC
        """,
        (student_id,),
    )
    results = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify({"success": True, "data": {
        "studentName": student["full_name"],
        "results": results,
    }})


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
    date_to = _parse_date(request.args.get("dateTo", ""))

    if date_from and date_to and date_from > date_to:
        return jsonify({"success": False, "message": "dateFrom phải nhỏ hơn hoặc bằng dateTo"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT teacher_id FROM students WHERE id = %s", (uid,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return jsonify({"success": True, "data": {
            "exams": [], "scores": [], "ranking": [],
            "progress": {"totalExams": 0, "done": 0, "avg": None},
        }})
    teacher_id = row["teacher_id"]

    lesson_rows = _lessons_with_stats(cur, uid, teacher_id, date_from, date_to)
    ranking_rows = _class_ranking(cur, teacher_id, date_from, date_to)
    cur.close()
    conn.close()

    exams = []
    scores = []
    for r in lesson_rows:
        done = bool(r["done"])
        score = None
        if done and r["total_questions"]:
            score = round((r["correct_questions"] or 0) / r["total_questions"] * 10, 1)
        exams.append({
            "examId": r["exam_id"],
            "examName": r["exam_name"],
            "lessonTitle": r["lesson_name"],
            "done": done,
            "score": score,
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
        "exams": exams,
        "scores": scores,
        "ranking": ranking,
        "progress": {"totalExams": len(exams), "done": done_count, "avg": avg},
    }})


def _lessons_with_stats(cur, student_id, teacher_id, date_from=None, date_to=None):
    sql = """
        SELECT l.id AS lesson_id, l.title AS lesson_name, l.created_at, l.description,
            e.id AS exam_id, e.name AS exam_name,
            CASE WHEN MAX(sa.id) IS NULL THEN 0 ELSE 1 END AS done,
            COUNT(DISTINCT q.id) AS total_questions,
            SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END) AS correct_questions,
            MAX(sa.time_spent) AS time_spent
        FROM lessons l
        JOIN exams e ON e.lesson_id = l.id
        LEFT JOIN student_answer sa ON sa.exam_id = e.id AND sa.user_id = %s
        LEFT JOIN answers a ON sa.answer_id = a.id
        LEFT JOIN questions q ON a.questionId = q.id
        WHERE l.teacher_id = %s
    """
    params = [student_id, teacher_id]
    if date_from:
        sql += " AND (sa.date_created IS NULL OR sa.date_created >= %s)"
        params.append(date_from)
    if date_to:
        sql += " AND (sa.date_created IS NULL OR sa.date_created < %s)"
        params.append(date_to + timedelta(days=1))
    sql += " GROUP BY l.id, e.id ORDER BY l.created_at DESC"
    cur.execute(sql, tuple(params))
    return cur.fetchall()


def _class_ranking(cur, teacher_id, date_from=None, date_to=None):
    sql = """
        SELECT s.id AS student_id, s.full_name AS student_name,
            COUNT(DISTINCT q.id) AS total_questions,
            SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END) AS correct_questions
        FROM students s
        LEFT JOIN student_answer sa ON sa.user_id = s.id
        LEFT JOIN answers a ON sa.answer_id = a.id
        LEFT JOIN questions q ON a.questionId = q.id
        WHERE s.teacher_id = %s
    """
    params = [teacher_id]
    if date_from:
        sql += " AND (sa.date_created IS NULL OR sa.date_created >= %s)"
        params.append(date_from)
    if date_to:
        sql += " AND (sa.date_created IS NULL OR sa.date_created < %s)"
        params.append(date_to + timedelta(days=1))
    sql += " GROUP BY s.id ORDER BY correct_questions DESC"
    cur.execute(sql, tuple(params))
    return cur.fetchall()
