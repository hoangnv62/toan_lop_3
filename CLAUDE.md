# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

E-learning platform for Grade 3 Math (Vietnamese). Two separate sub-projects:
- `backend/` — Node.js/Express REST API, MariaDB/MySQL, OpenRouter AI (via openai SDK)
- `frontend/` — React 19 SPA (Vite, Tailwind CSS 3)

Two user roles: **teacher** (manages classes/lessons/exams/question bank, views dashboard, uses AI chatbot) and **student** (takes exams, views progress, manages relatives).

## Commands

### Backend
```bash
cd backend
npm install
node database/create_db.js   # initialize schema (run once)
npm run dev                  # nodemon dev server on http://localhost:5000
npm start                    # production
```
Requires a MariaDB/MySQL database and a `.env` file — see `.env.example`. Database schema is in `database/create_db.js`.

### Frontend
```bash
cd frontend
npm install
npm run dev            # Vite dev server, default port 5173
npm run build          # production build → dist/
npm run lint           # ESLint
```

## Auth flow

1. On app mount, `AuthContext` checks `localStorage` for a JWT token; if present, calls `GET /api/auth/me` to restore user state
2. Token stored in `localStorage` via `setToken()` in `src/api/index.js`
3. All API calls attach `Authorization: Bearer <token>` via axios request interceptor
4. `RequireAuth` in `App.jsx` guards routes by `user.role` (`"teacher"` or `"student"`)
5. Separate login page for both roles; separate register page
6. Navigation after login: teacher → `/dashboard`, student → `/student`
7. Logout: clears token from localStorage (stateless — no server session to destroy)
8. Change password: `PUT /api/auth/password` (requires `currentPassword`, `newPassword`)
9. Update profile: `GET/PUT /api/auth/profile` (fields: `fullName`, `dob`, `email`, `phone`)

## Architecture

### Backend structure
Node.js ESM (`"type": "module"`), entry point `index.js`. Each feature has a route file in `src/routes/` that maps URLs to controllers, then services, then repositories:

```
index.js                    → App bootstrap, middleware setup, router registration
src/routes/                 → Express Router URL rules only (no logic)
src/controllers/            → Request parsing, auth checks, response formatting
src/services/               → Business logic
src/repositories/           → DB queries (raw SQL via mariadb connection pool)
src/middleware/             → authenticate, authorize, asyncHandler, errorHandler, camelCaseResponse, upload
src/validation/             → Zod schemas used as route middleware
src/validation/schema/      → Zod schema definitions
src/utils/error.utils.js    → AppError subclasses (NotFoundError, UnauthorizedError, etc.)
src/utils/response.js       → Standardized API response helpers
src/utils/llm.utils.js      → OpenAI/OpenRouter client factory
src/utils/date.utils.js     → Date helpers
src/constants/authority.js  → Role constants
src/config/env.js           → Typed env vars
src/config/database.js      → MariaDB connection pool
src/chat/                   → AI chatbot system (see below)
```

Database access: `mariadb` npm package, raw SQL, no ORM. `camelCaseResponse` middleware auto-converts snake_case DB column names to camelCase in JSON responses.  
Auth: `jsonwebtoken` (HS256, 24h) + `bcryptjs`. Token validated by `authenticate` middleware, populates `req.user`. Role checked by `authorize` middleware.  
Validation: `zod` schemas applied as Express middleware before controllers.  
AI calls: `openai` SDK pointed at `openrouter.ai/api/v1`. LLM client created via `src/utils/llm.utils.js`.  
File uploads: `multer` for Excel imports.  
PDF generation: `pdfkit`.  
Excel: `xlsx` (SheetJS) for import and export.

### AI Chatbot system (`src/chat/`)

```
src/chat/
  agent/
    teacher-agent.js    → Teacher-specific chat agent with tool calling
    student-agent.js    → Student-specific chat agent
  tools/
    registry.js         → Exports TEACHER_TOOLS, TOOL_LABELS, toolRegistry
    executor.js         → Executes tool calls by name
    search-question/    → search_question_bank tool
    save-question/      → save_questions_to_bank tool
    get-student-stats/  → get_student_stats tool
    get-lessons/        → get_lessons tool
    get-classes/        → get_classes tool
    create-exam/        → create_exam tool
    get-exam-stats/     → get_exam_stats tool
```

Teacher agent has 7 AI tools. Each tool folder contains `definition.js` (OpenAI tool schema) and `handler.js` (execution logic). Chat route: `POST /api/chat`.

### Key API endpoints (non-obvious ones)

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/api/auth/profile` | View/update profile (fullName, dob, email, phone) |
| PUT | `/api/auth/password` | Change password (`{currentPassword, newPassword}`) |
| POST | `/api/chat` | AI chatbot (role-aware: teacher gets tool calling) |
| POST | `/api/exams/:id/clone` | Deep-copy exam + questions + answers |
| POST | `/api/exams/:id/submissions/:studentId/comment` | Upsert teacher comment on student submission |
| GET | `/api/exams/:id/export` | Download Excel of all results (teacher only) |
| GET | `/api/exams/:id/export-pdf` | Download PDF exam paper (`?variants=1&duration=45`) |
| GET | `/api/exams/:id/assignments` | Per-class assignment status for an exam |
| POST | `/api/exams/:id/ai-feedback` | AI nhận xét đề thi |
| POST | `/api/exams/:id/ai-analysis` | AI phân tích thống kê kết quả |
| POST | `/api/questions/import-excel` | Parse Excel → return question array (not saved to DB) |
| GET | `/api/students/:id/progress` | All exam scores ordered by submit date (for line chart) |
| GET | `/api/dashboard/student?all=true` | Student dashboard without date filter |
| GET | `/api/classes/:id/exams` | Exams assigned to a class with completion stats |
| POST | `/api/classes/:id/exams` | Assign exam to class (`{examId, deadline, timeLimit, openTime}`) |
| PUT | `/api/classes/:id/exams/:examId` | Update exam assignment (deadline, timeLimit, openTime) |
| DELETE | `/api/classes/:id/exams/:examId` | Unassign exam from class |
| GET | `/api/classes/:id/students/export` | Export Excel danh sách học sinh |
| GET/POST | `/api/classes/:id/announcements` | Thông báo lớp học |
| DELETE | `/api/announcements/:annId` | Xóa thông báo |
| GET/POST | `/api/students/:studentId/relatives` | Danh sách / thêm người thân học sinh |
| PUT/DELETE | `/api/relatives/:id` | Sửa / xóa người thân |
| GET/POST | `/api/question-bank` | Ngân hàng câu hỏi (có phân trang, tìm kiếm, lọc theo lesson) |
| POST | `/api/question-bank/import-excel` | Import câu hỏi vào ngân hàng từ Excel |
| GET | `/api/question-bank/sample-excel` | Tải file Excel mẫu |

### Frontend structure
- `src/config.js` — single `API_BASE = 'http://localhost:5000'` constant used by all API modules
- `src/api/index.js` — axios instance with interceptors: attaches Bearer token, auto-unwraps `json.data`, throws on `success: false`. Also exports `downloadBlob(blob, filename)`.
- `src/api/` — one file per domain:
  - `auth.js` — login, register, logout, getMe, changePassword, getProfile, updateProfile
  - `examService.js` — exam CRUD, submit, result, stats, export, export-pdf, assignments, cloneExam, saveComment
  - `questionService.js` — generateQuestions, importQuestionsFromExcel (FormData POST)
  - `questionBankService.js` — getQuestionBank (paginated), createBankQuestion, updateBankQuestion, deleteBankQuestion, importQuestionBankFromExcel, downloadSampleQuestionBank
  - `studentService.js` — student dashboard, teacher dashboard, AI advice, student results, getStudentProgress
  - `classService.js` — class CRUD, getStudentsWithScores, exportStudents, getClassExams, assignExam, updateExamAssignment, unassignExam
  - `lessonService.js` — lesson CRUD
  - `announcementService.js` — getAnnouncements, createAnnouncement, deleteAnnouncement
  - `relativeService.js` — getRelatives, addRelative, updateRelative, deleteRelative
- `src/context/AuthContext.jsx` — provides `{ user, setUser, loading }` via `useAuth()` hook
- `src/components/Toast.jsx` — re-exports `{ toast, ToastContainer }` from `react-toastify`; use `toast.success()`, `toast.error()` etc.
- `src/components/TeacherLayout.jsx` — layout wrapper for all teacher pages (sidebar + main content)
- `src/components/ErrorBoundary.jsx` — React error boundary for graceful error handling
- `src/components/Sidebar.jsx` — teacher sidebar navigation
- `src/components/shared/ChatBot.jsx` — AI chatbot UI (floating button, conversation panel)
- Custom Tailwind component classes defined in `src/index.css`: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.card`, `.input`, `.badge-indigo`, `.badge-green`, `.badge-yellow`, `.badge-gray`, `.table-head`, `.table-row`, `.table-cell`

### Frontend routes (React Router v7)
| Path | Component | Role |
|---|---|---|
| `/` | Login | public |
| `/register` | Register | public |
| `/dashboard` | Dashboard | teacher |
| `/manage-class` | ManageClass | teacher |
| `/class-detail/:classId` | ClassDetail | teacher |
| `/manage-lesson` | ManageLesson | teacher |
| `/lesson-detail/:lessonId` | LessonDetail | teacher |
| `/question-bank` | QuestionBank | teacher |
| `/student` | StudentHome | student |
| `/student/exam/:examId` | StudentExam | student |
| `/exam-result/:examId` | ExamResult | student |

### Key UI behaviours
- **Sidebar** (teacher): "Cập nhật hồ sơ" opens `ProfileModal`; "Đổi mật khẩu" opens `ChangePasswordModal`; nav includes "Ngân hàng câu hỏi" → `/question-bank`; ChatBot floating button available on all teacher pages
- **StudentHome** (student): toggle "Theo tuần" / "Tất cả" controls date filter; lock icon opens `ChangePasswordModal`; `RelativesCard` shows and manages student relatives; `RankingCard` shows class ranking; `AnnouncementsCard` shows class announcements; `ClassResultsModal` shows detailed results per class
- **LessonDetail** (teacher): each exam has Clone (`FiCopy`) + Assign (`FiSend`) + Stats + Edit + Delete + Export PDF buttons; ExamModal toolbar has "Import Excel" for batch question upload and "Chọn từ ngân hàng" to pick from question bank
- **ClassDetail** (teacher): tabs for exam list, student roster (`StudentRoster`), announcements (`AnnouncementsCard`); `AddStudentCard` for adding students; `ImportCard` for bulk import; "Xem bài" opens `StudentResultsModal` (progress line chart + per-exam detail + teacher comment textarea)
- **ExamResult** (student): shows teacher comment block if `result.teacherComment` is set
- **QuestionBank** (teacher): paginated list with search + filter by lesson; supports create, edit, delete, import from Excel
- **ChatBot** (teacher): floating chat panel, role-aware (teacher sees tool-calling responses with loading labels like "Đang tìm câu hỏi...", "Đang tạo đề thi...")

### Excel import format for questions (`POST /api/questions/import-excel` and `/api/question-bank/import-excel`)
| Column | Required | Values |
|--------|----------|--------|
| `câu hỏi` | yes | Question text |
| `đáp án a` | yes | Answer A text |
| `đáp án b` | yes | Answer B text |
| `đáp án c` | yes | Answer C text |
| `đáp án d` | yes | Answer D text |
| `đáp án đúng` | yes | `a`, `b`, `c`, or `d` |
| `giải thích` | no | Explanation text |

`/api/questions/import-excel` returns questions without saving to DB (added to exam editor in memory).  
`/api/question-bank/import-excel` saves directly to `question_bank` table.
