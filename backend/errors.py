class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class NotFoundError(AppError):
    def __init__(self, message="Không tìm thấy"):
        super().__init__(message, 404)

class ConflictError(AppError):
    def __init__(self, message="Đã tồn tại"):
        super().__init__(message, 409)

class ForbiddenError(AppError):
    def __init__(self, message="Không có quyền"):
        super().__init__(message, 403)

class UnauthorizedError(AppError):
    def __init__(self, message="Chưa xác thực"):
        super().__init__(message, 401)
