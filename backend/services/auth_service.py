from extensions import db
from models.user import User
from repositories.user_repository import UserRepository
from utils import hash_password, verify_password, create_token
from errors import NotFoundError, ConflictError, UnauthorizedError

user_repo = UserRepository()


def register(username: str, password: str, full_name: str, role: str, dob=None):
    if user_repo.find_by_username(username):
        raise ConflictError("Tên đăng nhập đã tồn tại")
    user = user_repo.create(username, hash_password(password), full_name, role, dob)
    db.session.commit()
    token = create_token(user.id, role, full_name)
    return token, user


def login(username: str, password: str, role: str):
    user = user_repo.find_by_username_and_role(username, role)
    if not user or not verify_password(user.password, password):
        raise UnauthorizedError("Sai tài khoản hoặc mật khẩu")
    token = create_token(user.id, user.role, user.full_name)
    return token, user


def change_password(user_id: int, current_pw: str, new_pw: str):
    user = user_repo.find_by_id(user_id)
    if not user or not verify_password(user.password, current_pw):
        raise UnauthorizedError("Mật khẩu hiện tại không đúng")
    user_repo.update_password(user_id, hash_password(new_pw))
    db.session.commit()


def update_profile(user_id: int, full_name: str):
    user_repo.update_full_name(user_id, full_name)
    db.session.commit()
