export class AppError extends Error {
  constructor(message = 'Lỗi server', statusCode = 400) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Đã tồn tại') {
    super(message, 409);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Không có quyền') {
    super(message, 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Chưa xác thực') {
    super(message, 401);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Yêu cầu không hợp lệ') {
    super(message, 400);
  }
}
