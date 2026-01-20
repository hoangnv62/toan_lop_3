from flask import Blueprint, render_template, request, jsonify, session
from utils import get_db  # Import helper

lesson_bp = Blueprint("lesson", __name__)


@lesson_bp.route("/api/teacher/lessons", methods=["GET"])
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


@lesson_bp.route("/api/lessons/<int:lesson_id>", methods=["DELETE"])
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


@lesson_bp.route("/api/teacher/create-lesson", methods=["POST"])
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
