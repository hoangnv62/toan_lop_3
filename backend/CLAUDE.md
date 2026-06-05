# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup & Commands

**Runtime:** Node.js (ESM modules — `"type": "module"` in package.json)

```powershell
# First-time setup
npm install

# Initialize database (run once)
node database/create_db.js

# Run dev server with auto-reload (http://localhost:5000)
npm run dev

# Run production server
npm start
```

Required `.env` file (see `.env.example`):
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=math_learning
SECRET_KEY=your-secret-key-here
JWT_EXPIRES_IN=24h
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Architecture

### Request lifecycle
1. `index.js` registers 10 Express routers — all routes are prefixed `/api/`
2. Protected routes use `authenticate` middleware from `src/middleware/auth.middleware.js` — validates `Authorization: Bearer <token>` header and populates `req.user` with `{user_id, role, name}`
3. Database access via `mariadb` npm package (connection pool, raw SQL queries) — no ORM
4. Validation via `zod` schemas in `src/validation/`
5. AI calls via `openai` SDK pointed at `openrouter.ai/api/v1`, default model `openai/gpt-oss-120b:free`
6. All async route handlers wrapped with `asyncHandler` middleware for centralized error propagation
7. `camelCaseResponse` middleware auto-converts snake_case DB field names to camelCase in JSON responses

### Layer structure
```
index.js         → App bootstrap, middleware setup, router registration
src/routes/      → Express Router URL rules only (no logic)
src/controllers/ → Request parsing, auth checks, response formatting
src/services/    → Business logic
src/repositories/→ DB queries (raw SQL via mariadb pool)
src/middleware/  → authenticate, asyncHandler, errorHandler, camelCaseResponse, upload
src/validation/  → Zod schemas used as route middleware
src/utils/       → error.utils.js (AppError, NotFoundError, UnauthorizedError, etc.)
src/config/      → env.js (typed env vars)
```

### Auth system
- Stateless JWT (HS256, 24h expiry). No server-side sessions.
- Token created by `src/services/jwt.service.js`, validated by `authenticate` middleware
- Teacher login: `POST /api/auth/login/teacher` — username + password
- Student login: `POST /api/auth/login/student` — username + password
- Passwords: `bcryptjs` hashing
- Logout endpoint is a no-op (stateless)

### Router → URL prefix map
| File | URL prefix |
|---|---|
| auth.route.js | /api/auth |
| announcement.route.js | /api/announcements |
| class.route.js | /api/classes |
| dashboard.route.js | /api/dashboard |
| exam.route.js | /api/exams |
| lesson.route.js | /api/lessons |
| question.route.js | /api/questions |
| question-bank.route.js | /api/question-bank |
| relative.route.js | /api (students/:id/relatives, relatives/:id) |
| student.route.js | /api/students |

### Key API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/teacher` | Đăng ký giáo viên |
| POST | `/api/auth/register/student` | Đăng ký học sinh |
| POST | `/api/auth/login/teacher` | Đăng nhập giáo viên |
| POST | `/api/auth/login/student` | Đăng nhập học sinh |
| POST | `/api/auth/logout` | Logout (no-op) |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |
| GET/PUT | `/api/auth/profile` | Xem/cập nhật profile |
| PUT | `/api/auth/password` | Đổi mật khẩu (`{currentPassword, newPassword}`) |
| GET/POST | `/api/classes` | Danh sách / tạo lớp |
| GET/PUT/DELETE | `/api/classes/:id` | Chi tiết / sửa / xóa lớp |
| GET | `/api/classes/:id/students` | Học sinh + điểm của lớp |
| GET | `/api/classes/:id/students/export` | Export Excel danh sách học sinh |
| POST | `/api/classes/:classId/students` | Thêm học sinh vào lớp |
| POST | `/api/classes/:classId/students/upload` | Bulk upload học sinh từ Excel |
| DELETE | `/api/classes/:classId/students/:studentId` | Xóa học sinh khỏi lớp |
| GET/POST | `/api/classes/:id/exams` | Danh sách / giao bài cho lớp |
| PUT/DELETE | `/api/classes/:id/exams/:examId` | Cập nhật / hủy giao bài |
| GET/POST | `/api/classes/:id/announcements` | Thông báo lớp |
| DELETE | `/api/announcements/:annId` | Xóa thông báo |
| GET/POST | `/api/lessons` | Danh sách / tạo bài học |
| GET/PUT/DELETE | `/api/lessons/:id` | Chi tiết / sửa / xóa bài học |
| POST | `/api/lessons/:lessonId/exams` | Tạo đề thi |
| PUT | `/api/lessons/:lessonId/exams/:examId` | Cập nhật đề thi + câu hỏi |
| GET/DELETE | `/api/exams/:id` | Chi tiết / xóa đề thi |
| GET | `/api/exams/:id/assignments` | Trạng thái giao bài theo lớp |
| POST | `/api/exams/:id/clone` | Nhân bản đề thi |
| POST | `/api/exams/:id/submit` | Nộp bài |
| GET | `/api/exams/:id/result` | Kết quả bài làm |
| GET | `/api/exams/:id/stats` | Thống kê đề thi |
| GET | `/api/exams/:id/export` | Export Excel kết quả |
| GET | `/api/exams/:id/export-pdf` | Export PDF đề thi |
| GET | `/api/exams/:id/submissions/:studentId` | Bài làm của 1 học sinh |
| POST | `/api/exams/:id/submissions/:studentId/comment` | Nhận xét bài làm |
| POST | `/api/exams/:id/ai-feedback` | AI nhận xét đề thi |
| POST | `/api/exams/:id/ai-analysis` | AI phân tích thống kê |
| POST | `/api/questions/generate` | AI sinh câu hỏi (`{numQuestions, lessonTitle, examDescription}`) |
| POST | `/api/questions/import-excel` | Import câu hỏi từ Excel (không lưu DB) |
| GET/POST | `/api/question-bank` | Ngân hàng câu hỏi (có phân trang, tìm kiếm, lọc) |
| POST | `/api/question-bank/import-excel` | Import vào ngân hàng |
| GET | `/api/question-bank/sample-excel` | Tải file Excel mẫu |
| PUT/DELETE | `/api/question-bank/:id` | Sửa / xóa câu hỏi ngân hàng |
| GET | `/api/students/search` | Tìm kiếm học sinh |
| GET | `/api/students/:id/results` | Kết quả thi của học sinh |
| GET | `/api/students/:id/progress` | Biểu đồ tiến độ |
| GET/POST | `/api/students/:studentId/relatives` | Người thân học sinh |
| PUT/DELETE | `/api/relatives/:id` | Sửa / xóa người thân |
| GET | `/api/dashboard/teacher` | Dashboard giáo viên |
| POST | `/api/dashboard/advice` | AI tư vấn giảng dạy |
| GET | `/api/dashboard/student` | Dashboard học sinh (hỗ trợ `?all=true`) |

### AI integration
Uses `openai` npm SDK pointed at OpenRouter (`openrouter.ai/api/v1`):
- **Question generation**: takes `numQuestions`, `lessonTitle`, `examDescription` → returns structured MCQ array
- **Teaching advice**: analyzes class score distribution → returns Vietnamese teaching tips; falls back to hardcoded advice on failure
- **Exam AI feedback / stats analysis**: per-exam AI commentary endpoints

### API response conventions
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "..." }
```
Auth endpoints also return `"token"` in the response body. `AppError` subclasses (`NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `BadRequestError`) map to standard HTTP status codes. Unexpected errors return 500.

### Database schema
Xem `.claude/sql.md` để biết đầy đủ schema.
