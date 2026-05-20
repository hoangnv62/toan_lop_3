from flask import Blueprint, request, jsonify, g
from utils import get_db, require_auth

relatives_bp = Blueprint("relatives", __name__)

MAX_RELATIVES = 5


# ─── Xem danh sách người thân ─────────────────────────────────────────────────
@relatives_bp.route("/api/students/<int:student_id>/relatives", methods=["GET"])
@require_auth
def get_relatives(student_id):
    uid  = g.user["user_id"]
    role = g.user["role"]

    conn = get_db()
    cur  = conn.cursor(dictionary=True)

    if role == "student":
        if uid != student_id:
            cur.close(); conn.close()
            return jsonify({"success": False, "message": "Không có quyền truy cập"}), 403
    elif role == "teacher":
        cur.execute(
            """SELECT u.id FROM users u
               JOIN classes c ON u.class_id = c.id
               WHERE u.id = %s AND c.teacher_id = %s""",
            (student_id, uid),
        )
        if not cur.fetchone():
            cur.close(); conn.close()
            return jsonify({"success": False, "message": "Không có quyền truy cập"}), 403

    cur.execute(
        """SELECT id, name, phone, relationship, created_at
           FROM student_relatives
           WHERE student_id = %s
           ORDER BY created_at ASC""",
        (student_id,),
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    return jsonify({"success": True, "data": rows})


# ─── Thêm người thân ──────────────────────────────────────────────────────────
@relatives_bp.route("/api/students/<int:student_id>/relatives", methods=["POST"])
@require_auth
def add_relative(student_id):
    uid  = g.user["user_id"]
    role = g.user["role"]

    if role != "student" or uid != student_id:
        return jsonify({"success": False, "message": "Chỉ học sinh mới có thể thêm người thân"}), 403

    data         = request.json or {}
    name         = (data.get("name") or "").strip()
    phone        = (data.get("phone") or "").strip()
    relationship = (data.get("relationship") or "").strip() or None

    if not name or not phone:
        return jsonify({"success": False, "message": "Tên và số điện thoại không được trống"}), 400

    conn = get_db()
    cur  = conn.cursor(dictionary=True)

    cur.execute("SELECT COUNT(*) AS cnt FROM student_relatives WHERE student_id = %s", (student_id,))
    if cur.fetchone()["cnt"] >= MAX_RELATIVES:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": f"Tối đa {MAX_RELATIVES} người thân"}), 400

    cur.execute(
        "INSERT INTO student_relatives (student_id, name, phone, relationship) VALUES (%s, %s, %s, %s)",
        (student_id, name, phone, relationship),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return jsonify({"success": True, "message": "Đã thêm người thân", "data": {"id": new_id}}), 201


# ─── Sửa người thân ───────────────────────────────────────────────────────────
@relatives_bp.route("/api/relatives/<int:relative_id>", methods=["PUT"])
@require_auth
def update_relative(relative_id):
    uid  = g.user["user_id"]
    role = g.user["role"]

    if role != "student":
        return jsonify({"success": False, "message": "Chỉ học sinh mới có thể sửa người thân"}), 403

    conn = get_db()
    cur  = conn.cursor(dictionary=True)

    cur.execute("SELECT student_id FROM student_relatives WHERE id = %s", (relative_id,))
    rel = cur.fetchone()
    if not rel:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Không tìm thấy người thân"}), 404
    if rel["student_id"] != uid:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Không có quyền truy cập"}), 403

    data         = request.json or {}
    name         = (data.get("name") or "").strip()
    phone        = (data.get("phone") or "").strip()
    relationship = (data.get("relationship") or "").strip() or None

    if not name or not phone:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Tên và số điện thoại không được trống"}), 400

    cur.execute(
        "UPDATE student_relatives SET name=%s, phone=%s, relationship=%s WHERE id=%s",
        (name, phone, relationship, relative_id),
    )
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"success": True, "message": "Đã cập nhật người thân"})


# ─── Xóa người thân ───────────────────────────────────────────────────────────
@relatives_bp.route("/api/relatives/<int:relative_id>", methods=["DELETE"])
@require_auth
def delete_relative(relative_id):
    uid  = g.user["user_id"]
    role = g.user["role"]

    if role != "student":
        return jsonify({"success": False, "message": "Chỉ học sinh mới có thể xóa người thân"}), 403

    conn = get_db()
    cur  = conn.cursor(dictionary=True)

    cur.execute("SELECT student_id FROM student_relatives WHERE id = %s", (relative_id,))
    rel = cur.fetchone()
    if not rel:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Không tìm thấy người thân"}), 404
    if rel["student_id"] != uid:
        cur.close(); conn.close()
        return jsonify({"success": False, "message": "Không có quyền truy cập"}), 403

    cur.execute("DELETE FROM student_relatives WHERE id = %s", (relative_id,))
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"success": True, "message": "Đã xóa người thân"})
