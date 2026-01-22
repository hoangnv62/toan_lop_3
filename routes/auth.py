from flask import Blueprint, render_template, request, jsonify, session
from utils import get_db  # Import helper

auth_bp = Blueprint("auth", __name__)


# --- ROUTES GIAO DIỆN ---
@auth_bp.route("/")
def index():
    return render_template("login.html")


@auth_bp.route("/dashboard")
def dashboard_page():
    return (
        render_template("teacher/dashboard.html")
        if session.get("role") == "teacher"
        else render_template("login.html")
    )


@auth_bp.route("/sidebar")
def sidebar():
    return render_template("sidebar.html")


@auth_bp.route("/manage-class")
def manage_class_page():
    return render_template("teacher/class/class_page.html")


@auth_bp.route("/class-detail/<int:class_id>")
def render_class_detail(class_id):
    return render_template("teacher/class/class_detail.html", classId=class_id)


@auth_bp.route("/manage-lesson")
def manage_lesson_page():
    return render_template("teacher/lesson/lesson_page.html")


@auth_bp.route("/lesson-detail/<int:lesson_id>")
def render_lesson_detail(lesson_id):
    return render_template("teacher/lesson/lesson_detail.html", lessonId=lesson_id)


@auth_bp.route("/student")
def student_page():
    return (
        render_template("student/student_page.html")
        if session.get("role") == "student"
        else render_template("login.html")
    )


@auth_bp.route("/student/exam/<int:exam_id>")
def student_exam(exam_id):
    return render_template("student/student_exam.html", examId=exam_id)


@auth_bp.route("/exam-result")
def exam_result_page():
    return render_template("exam-result.html")


# --- API AUTH ---
@auth_bp.route("/api/login/teacher", methods=["POST"])
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
        return jsonify({"status": "success", "redirect": "/dashboard"})
    return jsonify({"status": "fail", "redirect": "/"})


@auth_bp.route("/api/check-student-phone", methods=["POST"])
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


@auth_bp.route("/api/login/student", methods=["POST"])
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


@auth_bp.route("/api/logout")
def logout():
    session.clear()
    return jsonify({"status": "success"})
