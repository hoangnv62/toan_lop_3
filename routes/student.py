from flask import Blueprint, render_template, request, jsonify, session
import pandas as pd
from io import BytesIO
from utils import get_db  # Import helper

student_bp = Blueprint("student", __name__)


# danh sách học sinh trong lớp học
@student_bp.route("/api/classes/<int:class_id>", methods=["GET"])
def get_class_detail(class_id):
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT * FROM students WHERE teacher_id=%s AND class_id=%s"
    params = [uid, class_id]
    cur.execute(sql, params)
    students = cur.fetchall()
    conn.close()
    return jsonify(students)


# Thêm học sinh vào lớp
@student_bp.route("/api/classes/<int:class_id>/students", methods=["POST"])
def add_student_to_class(class_id):
    uid = session.get("user_id")
    d = request.json
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO students (teacher_id, class_id, full_name, dob, parent_name, parent_phone) 
                       VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                uid,
                class_id,
                d["full_name"],
                d["dob"],
                d["parent_name"],
                d["parent_phone"],
            ),
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "fail", "msg": str(e)})


# Upload danh sách học sinh từ file Excel
@student_bp.route("/api/classes/<int:class_id>/upload-students", methods=["POST"])
def upload_students_to_class(class_id):
    uid = session.get("user_id")
    if not uid:
        return jsonify({"status": "fail", "msg": "Chưa đăng nhập"}), 401

    if "file" not in request.files:
        return jsonify({"status": "fail", "msg": "Không tìm thấy file"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"status": "fail", "msg": "Không chọn file"}), 400

    if not file.filename.lower().endswith((".xlsx", ".xls")):
        return (
            jsonify({"status": "fail", "msg": "Chỉ hỗ trợ file .xlsx hoặc .xls"}),
            400,
        )

    try:
        # Đọc file trực tiếp từ memory (không lưu đĩa)
        excel_data = BytesIO(file.read())
        df = pd.read_excel(excel_data)

        # Chuẩn hóa tên cột (bỏ khoảng trắng, viết thường để dễ khớp)
        df.columns = df.columns.str.strip().str.lower()

        # Các cột bắt buộc (có thể linh hoạt tên cột)
        required = ["tên học sinh", "tên phụ huynh", "số điện thoại phụ huynh"]
        missing = [col for col in required if col not in df.columns]
        if missing:
            return (
                jsonify(
                    {
                        "status": "fail",
                        "msg": f'File thiếu cột: {", ".join(missing)}. Vui lòng kiểm tra lại file.',
                    }
                ),
                400,
            )

        conn = get_db()
        cur = conn.cursor()

        success_count = 0
        error_list = []

        for _, row in df.iterrows():
            full_name = str(row["tên học sinh"]).strip()
            parent_name = str(row.get("tên phụ huynh", "")).strip()
            parent_phone = str(row["số điện thoại phụ huynh"]).strip()

            if not full_name or not parent_phone:
                error_list.append(f"Bỏ qua dòng: thiếu tên hoặc SĐT ({full_name})")
                continue

            try:
                cur.execute(
                    """
                    INSERT INTO students (teacher_id, class_id, full_name, parent_name, parent_phone)
                    VALUES (%s, %s, %s, %s, %s)
                """,
                    (uid, class_id, full_name, parent_name, parent_phone),
                )
                success_count += 1
            except Exception as e:
                error_list.append(f"Lỗi dòng {full_name}: {str(e)}")

        conn.commit()
        cur.close()
        conn.close()

        msg = f"Thêm thành công {success_count} học sinh."
        if error_list:
            msg += f" Có {len(error_list)} lỗi: " + "; ".join(error_list[:3])

        return jsonify({"status": "success", "msg": msg, "count": success_count})

    except Exception as e:
        return (
            jsonify({"status": "fail", "msg": f"Lỗi xử lý file Excel: {str(e)}"}),
            500,
        )


# XÓA HỌC SINH
@student_bp.route("/api/students/<int:user_id>", methods=["DELETE"])
def delete_student(user_id):
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM student_answer WHERE user_id=%s", (user_id,))
    cur.execute("DELETE FROM students WHERE id=%s AND teacher_id=%s", (user_id, uid))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


def get_teacher_id_by_student(cur, student_id):
    cur.execute("SELECT teacher_id FROM students WHERE id = %s", (student_id,))
    row = cur.fetchone()
    return row["teacher_id"] if row else None


def get_lessons_with_exam_stat(cur, student_id, teacher_id):
    sql = """
        SELECT 
            l.id            AS lesson_id,
            l.title         AS lesson_name,
            l.created_at,
            l.description,
            e.id            AS exam_id,
            e.name          AS exam_name,
            CASE WHEN sa.id IS NULL THEN 0 ELSE 1 END AS done,
            COUNT(DISTINCT q.id)                                   AS total_questions,
            SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END)     AS correct_questions,
            MAX(sa.time_spent)                                     AS time_spent
        FROM lessons l
        JOIN exams e ON e.lesson_id = l.id
        LEFT JOIN student_answer sa 
            ON sa.exam_id = e.id AND sa.user_id = %s
        LEFT JOIN answers a ON sa.answer_id = a.id
        LEFT JOIN questions q ON a.questionId = q.id
        WHERE l.teacher_id = %s
        GROUP BY l.id, e.id
        ORDER BY l.created_at DESC
    """
    cur.execute(sql, (student_id, teacher_id))
    return cur.fetchall()


def get_class_ranking(cur, teacher_id):
    sql = """
        SELECT 
            s.id   AS student_id,
            s.full_name AS student_name,
            COUNT(DISTINCT q.id)                                   AS total_questions,
            SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END)     AS correct_questions
        FROM students s
        LEFT JOIN student_answer sa ON sa.user_id = s.id
        LEFT JOIN answers a ON sa.answer_id = a.id
        LEFT JOIN questions q ON a.questionId = q.id
        WHERE s.teacher_id = %s
        GROUP BY s.id
        ORDER BY correct_questions DESC
    """
    cur.execute(sql, (teacher_id,))
    return cur.fetchall()


from datetime import datetime, timedelta


def parse_date(date_str):
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            pass
    return None


@student_bp.route("/api/student/dashboard", methods=["GET"])
def student_dashboard():
    uid = session.get("user_id")
    info = session.get("name")

    date_from_str = request.args.get("dateFrom")
    date_to_str = request.args.get("dateTo")

    date_from = parse_date(date_from_str)
    date_to = parse_date(date_to_str)

    if date_from and date_to and date_from > date_to:
        return jsonify({"error": "dateFrom must be <= dateTo"}), 400

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    teacher_id = get_teacher_id_by_student(cur, uid)
    if not teacher_id:
        conn.close()
        return jsonify({"info": info, "lessons": [], "ranking": []})

    lesson_rows = get_lessons_with_exam_stat(cur, uid, teacher_id, date_from, date_to)
    ranking_rows = get_class_ranking(cur, teacher_id, date_from, date_to)

    conn.close()

    # build lessons
    lesson_map = {}
    for r in lesson_rows:
        lid = r["lesson_id"]
        if lid not in lesson_map:
            lesson_map[lid] = {
                "id": lid,
                "name": r["lesson_name"],
                "created_at": r["created_at"],
                "description": r["description"],
                "exams": [],
            }

        lesson_map[lid]["exams"].append(
            {
                "id": r["exam_id"],
                "name": r["exam_name"],
                "done": r["done"],
                "total_questions": r["total_questions"] or 0,
                "correct_questions": r["correct_questions"] or 0,
                "time_spent": r["time_spent"] or 0,
            }
        )

    # build ranking
    ranking = []
    for r in ranking_rows:
        total = r["total_questions"] or 0
        correct = r["correct_questions"] or 0
        avg = round((correct / total) * 10, 2) if total > 0 else 0
        ranking.append(
            {"id": r["student_id"], "name": r["student_name"], "avg_score": avg}
        )

    return jsonify(
        {"info": info, "lessons": list(lesson_map.values()), "ranking": ranking}
    )


def get_lessons_with_exam_stat(
    cur, student_id, teacher_id, date_from=None, date_to=None
):
    sql = """
        SELECT 
            l.id      AS lesson_id,
            l.title   AS lesson_name,
            l.created_at,
            l.description,
            e.id      AS exam_id,
            e.name    AS exam_name,
            CASE WHEN sa.id IS NULL THEN 0 ELSE 1 END AS done,
            COUNT(DISTINCT q.id)                               AS total_questions,
            SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END) AS correct_questions,
            MAX(sa.time_spent)                                 AS time_spent
        FROM lessons l
        JOIN exams e ON e.lesson_id = l.id
        LEFT JOIN student_answer sa 
            ON sa.exam_id = e.id 
           AND sa.user_id = %s
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


def get_class_ranking(cur, teacher_id, date_from=None, date_to=None):
    sql = """
        SELECT 
            s.id AS student_id,
            s.full_name AS student_name,
            COUNT(DISTINCT q.id)                               AS total_questions,
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
