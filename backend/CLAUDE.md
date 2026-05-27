# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup & Commands

**Python requirement:** Use Python 3.12. Python 3.15 has no pre-built wheels for pandas/numpy and will fail to install.

```powershell
# First-time setup
"D:\manage python version\3.12.8\python.exe" -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Initialize database (run once)
python database/create_db.py

# Run dev server (http://localhost:5000)
python app.py
```

Required `.env` file:
```
OPENROUTER_API_KEY=
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=math_learning
SECRET_KEY=
```

## Architecture

### Request lifecycle
1. `app.py` registers 9 blueprints — all routes are prefixed `/api/`
2. Protected routes use `@require_auth` from `utils.py` — validates `Authorization: Bearer <token>` header and populates `flask.g.user` with `{user_id, role, name}`
3. Database access via SQLAlchemy ORM (`extensions.db`) — models in `models/`
4. AI calls via `config.init_chat_model()` — uses `instructor` + OpenAI client pointed at OpenRouter (`openrouter.ai/api/v1`), default model `openai/gpt-oss-120b:free`

### Layer structure
```
routes/      → Blueprint URL rules only (no logic)
controllers/ → Request parsing, auth checks, response formatting
services/    → Business logic
repositories/→ DB queries (SQLAlchemy ORM)
models/      → SQLAlchemy model definitions
```

### Auth system
- Stateless JWT (HS256, 24-hour expiry). No server-side sessions — the logout endpoint is a no-op.
- Token created by `utils.create_token()`, validated by `utils.require_auth()` decorator
- Teacher login: `POST /api/auth/login/teacher` — username + password
- Student login: `POST /api/auth/login/student` — username + password
- Passwords: Werkzeug PBKDF2 hashing with legacy plaintext fallback in `verify_password()`

### Blueprint → URL prefix map
| File | Blueprint var | URL prefix |
|---|---|---|
| routes/auth.py | auth_bp | /api/auth |
| routes/classes.py | classes_bp | /api/classes, /api/announcements |
| routes/lesson.py | lesson_bp | /api/lessons |
| routes/exam.py | exam_bp | /api/exams, /api/lessons |
| routes/question.py | question_bp | /api/questions |
| routes/question_bank.py | question_bank_bp | /api/question-bank |
| routes/student.py | student_bp | /api/students, /api/classes, /api/dashboard/student |
| routes/dashboard.py | dashboard_bp | /api/dashboard |
| routes/relatives.py | relatives_bp | /api/students, /api/relatives |

### Key API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/teacher` | Đăng ký giáo viên |
| POST | `/api/auth/register/student` | Đăng ký học sinh |
| POST | `/api/auth/login/teacher` | Đăng nhập giáo viên |
| POST | `/api/auth/login/student` | Đăng nhập học sinh |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |
| GET/PUT | `/api/auth/profile` | Xem/cập nhật profile |
| PUT | `/api/auth/password` | Đổi mật khẩu (`{currentPassword, newPassword}`) |
| GET/POST | `/api/classes` | Danh sách / tạo lớp |
| GET/PUT/DELETE | `/api/classes/<id>` | Chi tiết / sửa / xóa lớp |
| GET | `/api/classes/<id>/students` | Học sinh + điểm của lớp |
| GET | `/api/classes/<id>/students/export` | Export Excel danh sách học sinh |
| POST | `/api/classes/<id>/students` | Thêm học sinh vào lớp |
| POST | `/api/classes/<id>/students/upload` | Bulk upload học sinh từ Excel |
| DELETE | `/api/classes/<id>/students/<sid>` | Xóa học sinh khỏi lớp |
| GET/POST | `/api/classes/<id>/exams` | Danh sách / giao bài cho lớp |
| PUT/DELETE | `/api/classes/<id>/exams/<eid>` | Cập nhật / hủy giao bài |
| GET/POST | `/api/classes/<id>/announcements` | Thông báo lớp |
| DELETE | `/api/announcements/<id>` | Xóa thông báo |
| GET/POST | `/api/lessons` | Danh sách / tạo bài học |
| POST | `/api/lessons/<id>/exams` | Tạo đề thi |
| PUT | `/api/lessons/<id>/exams/<eid>` | Cập nhật đề thi + câu hỏi |
| GET/DELETE | `/api/exams/<id>` | Chi tiết / xóa đề thi |
| POST | `/api/exams/<id>/clone` | Nhân bản đề thi |
| POST | `/api/exams/<id>/submit` | Nộp bài |
| GET | `/api/exams/<id>/result` | Kết quả bài làm |
| GET | `/api/exams/<id>/stats` | Thống kê đề thi |
| GET | `/api/exams/<id>/export` | Export Excel kết quả |
| GET | `/api/exams/<id>/export-pdf` | Export PDF đề thi |
| GET | `/api/exams/<id>/assignments` | Trạng thái giao bài theo lớp |
| GET | `/api/exams/<id>/submissions/<sid>` | Bài làm của 1 học sinh |
| POST | `/api/exams/<id>/submissions/<sid>/comment` | Nhận xét bài làm |
| POST | `/api/questions/generate` | AI sinh câu hỏi (`{numQuestions, lessonTitle, examDescription}`) |
| POST | `/api/questions/import-excel` | Import câu hỏi từ Excel (không lưu DB) |
| GET/POST | `/api/question-bank` | Ngân hàng câu hỏi |
| POST | `/api/question-bank/import-excel` | Import vào ngân hàng |
| GET | `/api/question-bank/sample-excel` | Tải file Excel mẫu |
| PUT/DELETE | `/api/question-bank/<id>` | Sửa / xóa câu hỏi ngân hàng |
| GET | `/api/students/search` | Tìm kiếm học sinh |
| GET | `/api/students/<id>/results` | Kết quả thi của học sinh |
| GET | `/api/students/<id>/progress` | Biểu đồ tiến độ |
| GET/POST | `/api/students/<id>/relatives` | Người thân học sinh |
| PUT/DELETE | `/api/relatives/<id>` | Sửa / xóa người thân |
| GET | `/api/dashboard/teacher` | Dashboard giáo viên |
| POST | `/api/dashboard/advice` | AI tư vấn giảng dạy |
| GET | `/api/dashboard/student` | Dashboard học sinh (hỗ trợ `?all=true`) |

### AI integration
Two uses of AI (via `config.init_chat_model()`):
- **Question generation** (`services/question_service.py`): takes `numQuestions`, `lessonTitle`, `examDescription` → returns structured list of MCQ objects via `instructor` + Pydantic model
- **Teaching advice** (`services/dashboard_service.py`): analyzes class score distribution → returns 3 Vietnamese teaching tips; falls back to hardcoded advice on failure

### API response conventions
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "..." }
```
Auth endpoints also return `"token"` in the response body. Status codes: 200/201 success, 400 bad request, 401 unauthorized, 403 forbidden, 404 not found, 409 conflict, 500 server error.

### Database schema
Xem `.claude/sql.md` để biết đầy đủ schema.
