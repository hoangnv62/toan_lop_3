from extensions import db
from models.user import User


class UserRepository:
    def find_by_id(self, user_id: int) -> User | None:
        return db.session.get(User, user_id)

    def find_by_username(self, username: str) -> User | None:
        return db.session.execute(
            db.select(User).where(User.username == username)
        ).scalar_one_or_none()

    def find_by_username_and_role(self, username: str, role: str) -> User | None:
        return db.session.execute(
            db.select(User).where(User.username == username, User.role == role)
        ).scalar_one_or_none()

    def create(self, username: str, password: str, full_name: str, role: str, dob=None) -> User:
        user = User(username=username, password=password, full_name=full_name, role=role, dob=dob)
        db.session.add(user)
        db.session.flush()
        return user

    def update_password(self, user_id: int, hashed: str) -> None:
        user = db.session.get(User, user_id)
        if user:
            user.password = hashed

    def update_full_name(self, user_id: int, full_name: str) -> None:
        user = db.session.get(User, user_id)
        if user:
            user.full_name = full_name

    def get_profile(self, user_id: int) -> dict | None:
        user = db.session.get(User, user_id)
        if not user:
            return None
        return {
            "username":  user.username,
            "full_name": user.full_name,
            "dob":       str(user.dob) if user.dob else None,
            "email":     user.email,
            "phone":     user.phone,
        }

    def update_profile(self, user_id: int, full_name: str, dob=None, email: str | None = None, phone: str | None = None) -> None:
        user = db.session.get(User, user_id)
        if user:
            user.full_name = full_name
            user.dob       = dob
            user.email     = email or None
            user.phone     = phone or None

    def search_students(self, q: str, limit: int = 20) -> list:
        from sqlalchemy import text
        sql = text("""
            SELECT u.id, u.username, u.full_name, u.dob, u.class_id, c.class_name AS current_class
            FROM users u
            LEFT JOIN classes c ON c.id = u.class_id
            WHERE u.role = 'student' AND u.username LIKE :q
            LIMIT :lim
        """)
        rows = db.session.execute(sql, {"q": f"%{q}%", "lim": limit}).mappings().all()
        return [dict(r) for r in rows]
