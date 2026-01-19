import os
import json
import re
import mysql.connector
import google.generativeai as genai
import pandas as pd
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "math_secret_key")
CORS(app)

db_config = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "elearning_math_db"),
}

# Cấu hình AI
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel("models/gemini-2.5-flash")
    except:
        model = genai.GenerativeModel("gemini-1.5-flash")


def get_db():
    try:
        return mysql.connector.connect(**db_config)
    except:
        return None


def clean_json_string(text):
    try:
        match = re.search(r"\[.*\]", text, re.DOTALL)
        return match.group(0) if match else "[]"
    except:
        return "[]"


# --- ROUTES GIAO DIỆN ---
@app.route("/")
def index():
    return render_template("login.html")


@app.route("/teacher")
def teacher_page():
    return (
        render_template("teacher.html")
        if session.get("role") == "teacher"
        else render_template("login.html")
    )


@app.route("/student")
def student_page():
    return (
        render_template("student.html")
        if session.get("role") == "student"
        else render_template("login.html")
    )


# --- API AUTH
@app.route("/api/login/teacher", methods=["POST"])
def login_teacher():
    d = request.json
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT * FROM teachers WHERE username=%s AND password=%s",
        (d["username"], d["password"]),
    )
    u = cur.fetchone()
    conn.close()
    if u:
        session.update({"user_id": u["id"], "role": "teacher", "name": u["full_name"]})
        return jsonify({"status": "success", "redirect": "/teacher"})
    return jsonify({"status": "fail", "msg": "Sai thông tin"})


@app.route("/api/check-student-phone", methods=["POST"])
def check_phone():
    p = request.json.get("phone")
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT id, full_name, password FROM students WHERE parent_phone=%s", (p,)
    )
    u = cur.fetchone()
    conn.close()
    if u:
        return jsonify(
            {
                "exists": True,
                "has_password": bool(u["password"]),
                "name": u["full_name"],
            }
        )
    return jsonify({"exists": False})


@app.route("/api/login/student", methods=["POST"])
def login_student():
    d = request.json
    phone = d.get("phone")
    password = d.get("password")

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        "SELECT * FROM students WHERE parent_phone = %s",
        (phone,),
    )
    u = cur.fetchone()

    # Không tìm thấy tài khoản
    if not u:
        conn.close()
        return jsonify(
            {"status": "fail", "msg": "Số điện thoại chưa được đăng ký trong hệ thống"}
        )

    # Lần đầu đăng nhập -> đăng ký mật khẩu
    if u["password"] is None or u["password"] == "":
        cur.execute(
            "UPDATE students SET password = %s WHERE id = %s",
            (password, u["id"]),
        )
        conn.commit()
        conn.close()

        session.update({"user_id": u["id"], "role": "student", "name": u["full_name"]})

        return jsonify(
            {"status": "success", "msg": "Đăng ký thành công", "redirect": "/student"}
        )

    # Đã có mật khẩu -> kiểm tra đăng nhập
    if u["password"] != password:
        conn.close()
        return jsonify({"status": "fail", "msg": "Sai mật khẩu"})

    # Đăng nhập thành công
    conn.close()
    session.update({"user_id": u["id"], "role": "student", "name": u["full_name"]})

    return jsonify({"status": "success", "redirect": "/student"})


@app.route("/api/logout")
def logout():
    session.clear()
    return jsonify({"status": "success"})


# --- API QUẢN LÝ LỚP HỌC (NEW) ---
@app.route("/api/teacher/classes", methods=["GET", "POST", "DELETE"])
def manage_classes():
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    if request.method == "GET":
        cur.execute(
            "SELECT * FROM classes WHERE teacher_id=%s ORDER BY created_at DESC", (uid,)
        )
        res = cur.fetchall()
        conn.close()
        return jsonify(res)

    if request.method == "POST":
        d = request.json
        cur.execute(
            "INSERT INTO classes (teacher_id, class_name) VALUES (%s, %s)",
            (uid, d["class_name"]),
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})

    if request.method == "DELETE":
        cid = request.args.get("id")
        cur.execute("DELETE FROM classes WHERE id=%s AND teacher_id=%s", (cid, uid))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})


# Thêm lớp học mới
@app.route("/api/classes", methods=["POST"])
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


# --- API QUẢN LÝ HỌC SINH & EXCEL (NEW) ---


# danh sách lớp học của giáo viên
@app.route("/api/classes", methods=["GET"])
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


# danh sách học sinh trong lớp học
@app.route("/api/classes/<int:class_id>", methods=["GET"])
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


# XÓA LỚP HỌC
@app.route("/api/classes/<int:class_id>", methods=["DELETE"])
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


# Thêm học sinh vào lớp
@app.route("/api/classes/<int:class_id>/students", methods=["POST"])
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


from flask import request, jsonify, session
import pandas as pd
from io import BytesIO


@app.route("/api/classes/<int:class_id>/upload-students", methods=["POST"])
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


@app.route("/api/students/<int:user_id>", methods=["DELETE"])
def delete_student(user_id):
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM student_answer WHERE user_id=%s", (user_id,))
    cur.execute("DELETE FROM students WHERE id=%s AND teacher_id=%s", (user_id, uid))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/teacher/students", methods=["GET", "POST"])
def manage_students():
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    if request.method == "GET":
        class_id = request.args.get("class_id")
        sql = "SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.teacher_id=%s"
        params = [uid]
        if class_id:
            sql += " AND s.class_id=%s"
            params.append(class_id)
        cur.execute(sql, params)
        stds = cur.fetchall()
        # Tính điểm TB
        for s in stds:
            cur.execute("SELECT score FROM student_answer WHERE user_id=%s", (s["id"],))
            sc = [r["score"] for r in cur.fetchall()]
            s["avg"] = round(sum(sc) / len(sc), 1) if sc else 0
        conn.close()
        return jsonify(stds)

    if request.method == "POST":  # Thêm 1 học sinh
        d = request.json
        try:
            cur.execute(
                """INSERT INTO students (teacher_id, class_id, full_name, dob, parent_name, parent_phone) 
                           VALUES (%s, %s, %s, %s, %s, %s)""",
                (
                    uid,
                    d["class_id"],
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


@app.route("/api/teacher/upload-excel", methods=["POST"])
def upload_excel():
    uid = session.get("user_id")
    if "file" not in request.files:
        return jsonify({"status": "fail", "msg": "Không có file"})
    file = request.files["file"]
    class_id = request.form.get("class_id")

    try:
        df = pd.read_excel(file)
        # Yêu cầu file Excel có cột: HoTen, NgaySinh, PhuHuynh, SDT
        conn = get_db()
        cur = conn.cursor()
        count = 0
        for _, row in df.iterrows():
            dob = (
                pd.to_datetime(row["NgaySinh"]).strftime("%Y-%m-%d")
                if pd.notnull(row["NgaySinh"])
                else None
            )
            try:
                cur.execute(
                    """INSERT INTO students (teacher_id, class_id, full_name, dob, parent_name, parent_phone) 
                               VALUES (%s, %s, %s, %s, %s, %s)""",
                    (
                        uid,
                        class_id,
                        row["HoTen"],
                        dob,
                        row["PhuHuynh"],
                        str(row["SDT"]),
                    ),
                )
                count += 1
            except:
                pass  # Bỏ qua nếu trùng SĐT
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "count": count})
    except Exception as e:
        return jsonify({"status": "fail", "msg": str(e)})


# --- API BÀI HỌC & ĐỀ THI (Giữ nguyên logic cũ, thêm created_at cho lịch) ---
@app.route("/api/teacher/lessons", methods=["GET"])
def get_ls():
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT * FROM lessons WHERE teacher_id=%s ORDER BY created_at DESC", (uid,)
    )
    ls = cur.fetchall()
    conn.close()
    return jsonify(ls)


@app.route("/api/lessons/<int:lesson_id>", methods=["DELETE"])
def delete_lesson(lesson_id):
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor()
    # Xóa các đề thi liên quan đến bài học
    cur.execute("DELETE FROM exams WHERE lesson_id=%s", (lesson_id,))
    # Xóa bài học
    cur.execute("DELETE FROM lessons WHERE id=%s AND teacher_id=%s", (lesson_id, uid))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/teacher/create-lesson", methods=["POST"])
def create_ls():
    d = request.json
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO lessons (teacher_id, title, description) VALUES (%s, %s, '')",
        (uid, d["title"]),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/questions/generate", methods=["POST"])
def gen_exam():
    d = request.json
    num_questions = d["numQuestions"]
    lesson_title = d["lessonTitle"]
    exam_description = d["examDescription"]
    prompt = f"""
    Giáo viên Toán lớp 3. Tạo {num_questions} câu trắc nghiệm '{lesson_title}'. {exam_description}
    HÌNH ẢNH SVG: Dùng <circle>, <rect>... màu sắc đẹp minh họa số lượng. KHÔNG dùng Emoji.
    Format JSON Array: [
    {{ 
        "questionContent": "...", 
        "svg_code": "...", 
        "explanation": "...",
        "answers": [
            {{
                "content": "...",
                "isCorrected": true/false
            }}
        ]
    }}]
    """
    try:
        res = model.generate_content(prompt)
        return jsonify(
            {"status": "success", "data": json.loads(clean_json_string(res.text))}
        )
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})


@app.route("/api/exams/<int:exam_id>/questions", methods=["GET"])
def get_questions(exam_id):
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
    conn.close()

    questions_map = {}
    if not rows:
        return jsonify({"status": "success", "data": []})
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

    return jsonify({"status": "success", "data": list(questions_map.values())})


@app.route("/api/exams/<int:exam_id>", methods=["GET"])
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


@app.route("/api/lessons/<int:lesson_id>/exams/<int:exam_id>", methods=["PUT"])
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


@app.route("/api/lessons/<int:lesson_id>/exams", methods=["POST"])
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


# lấy danh sách đề thi theo bài học
@app.route("/api/lesson/<int:lesson_id>", methods=["GET"])
def get_exams(lesson_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM exams WHERE lesson_id=%s", (lesson_id,))
    exams = cur.fetchall()
    conn.close()
    return jsonify(exams)


# --- API BÁO CÁO TỔNG QUAN & AI ADVICE (NEW) ---
@app.route("/api/teacher/stats/overall", methods=["GET"])
def overall_stats():
    teacher_id = session.get("user_id")
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    sql = """
        SELECT
            COUNT(*)                                   AS total_exams_taken,
            ROUND(AVG(score10), 1)                     AS class_avg,
            SUM(CASE WHEN score10 >= 9 THEN 1 ELSE 0 END) AS excellent,
            SUM(CASE WHEN score10 BETWEEN 7 AND 8.99 THEN 1 ELSE 0 END) AS good,
            SUM(CASE WHEN score10 BETWEEN 5 AND 6.99 THEN 1 ELSE 0 END) AS average,
            SUM(CASE WHEN score10 < 5 THEN 1 ELSE 0 END) AS weak
        FROM (
            SELECT 
                sa.user_id,
                sa.exam_id,

                -- quy đổi về thang 10
                ROUND(
                    SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END)
                    / COUNT(DISTINCT q.id) * 10, 
                2) AS score10

            FROM student_answer sa
            JOIN answers a    ON sa.answer_id = a.id
            JOIN questions q  ON a.questionId = q.id
            JOIN exams e      ON sa.exam_id = e.id
            JOIN lessons l   ON e.lesson_id = l.id
            WHERE l.teacher_id = %s
            GROUP BY sa.user_id, sa.exam_id
        ) t;

    """

    cur.execute(sql, (teacher_id,))
    r = cur.fetchone()
    cur.execute(
        """
        SELECT COUNT(*) FROM students s WHERE s.teacher_id=%s
    """,
        (teacher_id,),
    )
    student_count = cur.fetchone()["COUNT(*)"]
    conn.close()

    return jsonify(
        {
            "student_count": student_count,
            "total_exams_taken": r["total_exams_taken"],
            "class_avg": float(r["class_avg"] or 0),
            "distribution": [
                int(r["excellent"]),
                int(r["good"]),
                int(r["average"]),
                int(r["weak"]),
            ],
        }
    )


# API LỜI KHUYÊN TỪ AI
@app.route("/api/teacher/get-advice", methods=["POST"])
def get_ai_advice():
    d = request.json

    prompt = f"""
                Bạn là trợ lý giáo dục chuyên về Toán lớp 3. Dựa trên thống kê lớp học:
                - Điểm trung bình: {d.get('avg', 0)}
                - Số bài làm: {d.get('total', 0)}
                - Phân bố (Giỏi/Khá/TB/Yếu): {d.get('dist', [0,0,0,0])}
                    
                Hãy đưa ra đúng **3 lời khuyên** ngắn gọn, thiết thực cho giáo viên để cải thiện chất lượng dạy học.
                **QUAN TRỌNG**: Chỉ trả về MẢNG JSON thuần túy, KHÔNG thêm bất kỳ ký tự nào khác (không có ```json
                [{{
                    "title": "Tiêu đề ngắn gọn",
                    "detail": "Nội dung chi tiết lời khuyên"
                }}, ...]
                """

    try:
        res = model.generate_content(prompt)
        raw_text = res.text.strip()

        print("Gemini raw response:", raw_text)  # Debug để xem chính xác Gemini trả gì

        # Làm sạch: loại bỏ ```json, ``` và các ký tự thừa
        cleaned_text = re.sub(
            r"^```json\s*|\s*```$", "", raw_text, flags=re.IGNORECASE | re.MULTILINE
        ).strip()
        cleaned_text = re.sub(
            r"^\s*\[|\]\s*$", "", cleaned_text
        ).strip()  # loại bỏ [ ] nếu thừa

        # Parse thành list JSON
        try:
            advice_list = json.loads(f"[{cleaned_text}]")
        except json.JSONDecodeError:
            # Nếu parse lỗi, thử parse trực tiếp (trường hợp Gemini trả mảng mà không có dấu ngoặc ngoài)
            advice_list = json.loads(cleaned_text)

        print("Cleaned advice list:", advice_list)
        return jsonify({"advice": advice_list})  # Trả về array JSON trực tiếp

    except Exception as e:
        print("Lỗi khi gọi Gemini:", str(e))
        # Fallback an toàn
        fallback = [
            {
                "title": "Tăng cường luyện tập cơ bản",
                "detail": "Tổ chức các bài tập ngắn hàng ngày để củng cố kiến thức nền.",
            },
            {
                "title": "Sử dụng phương pháp trực quan",
                "detail": "Dùng hình ảnh, mô hình, trò chơi để minh họa bài học cho học sinh lớp 3.",
            },
            {
                "title": "Phụ đạo cá nhân hóa",
                "detail": "Theo dõi và hỗ trợ riêng cho các em yếu để nâng cao kết quả chung.",
            },
        ]
        return jsonify({"advice": fallback})


# --- API HỌC SINH ---
@app.route("/api/student/data")
def std_data():
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    # 1. Lấy teacher của sinh viên
    cur.execute("SELECT teacher_id FROM students WHERE id=%s", (uid,))
    s = cur.fetchone()
    if not s:
        conn.close()
        return jsonify({"lessons": []})

    # 2. Lấy lesson
    cur.execute(
        """
        SELECT * 
        FROM lessons 
        WHERE teacher_id=%s 
        ORDER BY created_at DESC
    """,
        (s["teacher_id"],),
    )
    ls = cur.fetchall()

    # 3. Lấy exam + trạng thái làm bài
    for l in ls:
        cur.execute(
            """
            SELECT 
                e.*,
                CASE 
                    WHEN sa.id IS NULL THEN 0 
                    ELSE 1 
                END AS done
            FROM exams e
            LEFT JOIN student_answer sa 
                ON sa.exam_id = e.id 
               AND sa.user_id = %s
            WHERE e.lesson_id = %s
            GROUP BY e.id
        """,
            (uid, l["id"]),
        )

        l["exams"] = cur.fetchall()

    conn.close()
    return jsonify({"lessons": ls, "info": session.get("name")})


@app.route("/api/student/exam/<int:eid>")
def std_ex(eid):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM questions WHERE exam_id=%s", (eid,))
    qs = cur.fetchall()
    for q in qs:
        q["options"] = json.loads(q["options"])
    conn.close()
    return jsonify(qs)


@app.route("/api/student/submit", methods=["POST"])
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


@app.route("/api/student/history", methods=["GET"])
def std_hist():
    uid = session.get("user_id")
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    sql = """
        SELECT 
            e.id                     AS exam_id,
            l.id                     AS lesson_id,
            l.title                  AS lesson_title,
            e.name                   AS exam_name,
            SUM(CASE WHEN a.isCorrected = 1 THEN 1 ELSE 0 END) AS score,
            COUNT(DISTINCT q.id)     AS total_questions,
            MAX(sa.time_spent)       AS time_spent,
            MAX(sa.id)               AS last_answer_id 
        FROM 
            student_answer sa
            INNER JOIN exams e       ON sa.exam_id = e.id
            INNER JOIN lessons l     ON e.lesson_id = l.id
            INNER JOIN answers a     ON sa.answer_id = a.id
            INNER JOIN questions q   ON a.questionId = q.id
        WHERE 
            sa.user_id = %s
        GROUP BY 
            sa.exam_id
        ORDER BY 
            MAX(sa.id) DESC;
    """

    cur.execute(sql, (uid,))
    rows = cur.fetchall()
    conn.close()

    lessons = {}

    for r in rows:
        lid = r["lesson_id"]

        if lid not in lessons:
            lessons[lid] = {
                "lesson_id": lid,
                "lesson_title": r["lesson_title"],
                "exams": [],
            }

        lessons[lid]["exams"].append(
            {
                "exam_id": r["exam_id"],
                "exam_name": r["exam_name"],
                "score": r["score"],
                "total_questions": r["total_questions"],
                "time_spent": r["time_spent"],
            }
        )

    return jsonify(list(lessons.values()))


if __name__ == "__main__":
    app.run(debug=True, port=5000)
