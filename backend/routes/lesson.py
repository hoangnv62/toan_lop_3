from flask import Blueprint, request, jsonify, g
from utils import get_db, require_auth

lesson_bp = Blueprint("lesson", __name__)


@lesson_bp.route("/api/lessons", methods=["GET"])
@require_auth
def get_lessons():
    uid = g.user["user_id"]
    q = request.args.get("q", "").strip()
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        if q:
            cur.execute(
                """
                SELECT l.*, COUNT(e.id) AS exam_count
                FROM lessons l
                LEFT JOIN exams e ON e.lesson_id = l.id
                WHERE l.teacher_id=%s AND l.title LIKE %s
                GROUP BY l.id ORDER BY l.created_at DESC
                """,
                (uid, f"%{q}%"),
            )
        else:
            cur.execute(
                """
                SELECT l.*, COUNT(e.id) AS exam_count
                FROM lessons l
                LEFT JOIN exams e ON e.lesson_id = l.id
                WHERE l.teacher_id=%s
                GROUP BY l.id ORDER BY l.created_at DESC
                """,
                (uid,),
            )
        lessons = cur.fetchall()
        return jsonify({"success": True, "data": lessons})
    finally:
        cur.close()
        conn.close()


@lesson_bp.route("/api/lessons/<int:lesson_id>", methods=["GET"])
@require_auth
def get_lesson(lesson_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM lessons WHERE id=%s", (lesson_id,))
        lesson = cur.fetchone()
        if not lesson:
            return jsonify({"success": False, "message": "Bài học không tồn tại"}), 404

        cur.execute("SELECT * FROM exams WHERE lesson_id=%s ORDER BY date_created DESC", (lesson_id,))
        exams = cur.fetchall()
        return jsonify({"success": True, "data": {
            "lessonId": lesson["id"],
            "lessonTitle": lesson["title"],
            "description": lesson.get("description") or "",
            "exams": exams,
        }})
    finally:
        cur.close()
        conn.close()


@lesson_bp.route("/api/lessons", methods=["POST"])
@require_auth
def create_lesson():
    uid = g.user["user_id"]
    title = (request.json or {}).get("title", "").strip()
    if not title:
        return jsonify({"success": False, "message": "Tiêu đề không được trống"}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO lessons (teacher_id, title, description) VALUES (%s, %s, '')",
            (uid, title),
        )
        conn.commit()
        return jsonify({"success": True, "message": "Tạo bài học thành công"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@lesson_bp.route("/api/lessons/<int:lesson_id>", methods=["PUT"])
@require_auth
def update_lesson(lesson_id):
    uid = g.user["user_id"]
    title = (request.json or {}).get("title", "").strip()
    if not title:
        return jsonify({"success": False, "message": "Tiêu đề không được trống"}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE lessons SET title=%s WHERE id=%s AND teacher_id=%s",
            (title, lesson_id, uid),
        )
        conn.commit()
        return jsonify({"success": True, "message": "Cập nhật bài học thành công"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@lesson_bp.route("/api/lessons/<int:lesson_id>", methods=["DELETE"])
@require_auth
def delete_lesson(lesson_id):
    uid = g.user["user_id"]
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM exams WHERE lesson_id=%s", (lesson_id,))
        cur.execute("DELETE FROM lessons WHERE id=%s AND teacher_id=%s", (lesson_id, uid))
        conn.commit()
        return jsonify({"success": True, "message": "Đã xóa bài học"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close()
        conn.close()
