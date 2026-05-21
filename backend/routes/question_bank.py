from flask import Blueprint, request, jsonify, g
from utils import get_db, require_auth

question_bank_bp = Blueprint("question_bank", __name__)


@question_bank_bp.route("/api/question-bank", methods=["GET"])
@require_auth
def list_questions():
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        "SELECT id, content, explanation, created_at FROM question_bank WHERE teacher_id=%s ORDER BY created_at DESC",
        (g.user["user_id"],),
    )
    questions = cur.fetchall()

    for q in questions:
        q["created_at"] = str(q["created_at"]) if q["created_at"] else None
        cur.execute(
            "SELECT id, content, is_correct FROM question_bank_answers WHERE question_id=%s ORDER BY id",
            (q["id"],),
        )
        q["answers"] = cur.fetchall()

    cur.close(); conn.close()
    return jsonify({"success": True, "data": questions})


@question_bank_bp.route("/api/question-bank", methods=["POST"])
@require_auth
def create_question():
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403

    data = request.get_json() or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"success": False, "message": "Nội dung câu hỏi không được trống"}), 400

    explanation = data.get("explanation") or None
    answers = data.get("answers", [])

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO question_bank (teacher_id, content, explanation) VALUES (%s,%s,%s)",
            (g.user["user_id"], content, explanation),
        )
        new_id = cur.lastrowid
        for a in answers:
            cur.execute(
                "INSERT INTO question_bank_answers (question_id, content, is_correct) VALUES (%s,%s,%s)",
                (new_id, a.get("content", ""), 1 if a.get("is_correct") else 0),
            )
        conn.commit()
        return jsonify({"success": True, "id": new_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@question_bank_bp.route("/api/question-bank/<int:question_id>", methods=["PUT"])
@require_auth
def update_question(question_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403

    data = request.get_json() or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"success": False, "message": "Nội dung câu hỏi không được trống"}), 400

    explanation = data.get("explanation") or None
    answers = data.get("answers", [])

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        "SELECT id FROM question_bank WHERE id=%s AND teacher_id=%s",
        (question_id, g.user["user_id"]),
    )
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Câu hỏi không tồn tại"}), 404

    try:
        cur.execute(
            "UPDATE question_bank SET content=%s, explanation=%s WHERE id=%s",
            (content, explanation, question_id),
        )
        cur.execute("DELETE FROM question_bank_answers WHERE question_id=%s", (question_id,))
        for a in answers:
            cur.execute(
                "INSERT INTO question_bank_answers (question_id, content, is_correct) VALUES (%s,%s,%s)",
                (question_id, a.get("content", ""), 1 if a.get("is_correct") else 0),
            )
        conn.commit()
        return jsonify({"success": True, "message": "Đã cập nhật câu hỏi"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


@question_bank_bp.route("/api/question-bank/<int:question_id>", methods=["DELETE"])
@require_auth
def delete_question(question_id):
    if g.user["role"] != "teacher":
        return jsonify({"success": False, "message": "Không có quyền"}), 403

    conn = get_db()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        "SELECT id FROM question_bank WHERE id=%s AND teacher_id=%s",
        (question_id, g.user["user_id"]),
    )
    if not cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Câu hỏi không tồn tại"}), 404

    try:
        cur.execute("DELETE FROM question_bank WHERE id=%s", (question_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Đã xóa câu hỏi"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()
