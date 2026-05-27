# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

E-learning platform for Grade 3 Math (Vietnamese). Two separate sub-projects:
- `backend/` — Flask REST API, MySQL, OpenRouter AI (via instructor + OpenAI client)
- `frontend/` — React 19 SPA (Vite, Tailwind CSS)

Two user roles: **teacher** (manages classes/lessons/exams/question bank, views dashboard) and **student** (takes exams, views progress, manages relatives).

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py          # runs on http://localhost:5000
```
Requires a MySQL database and a `.env` file with `OPENROUTER_API_KEY`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SECRET_KEY`. Database schema is in `database/create_db.py`.

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
2. Token is stored in `localStorage` via `setToken()` in `src/api/index.js`
3. All API calls attach `Authorization: Bearer <token>` header via `apiFetch()`
4. `RequireAuth` in `App.jsx` guards routes by `user.role` (`"teacher"` or `"student"`)
5. Separate login page for both roles; separate register page
6. Navigation after login: teacher → `/dashboard`, student → `/student`
7. Logout: clears token from localStorage (stateless — no server session to destroy)
8. Change password: `PUT /api/auth/password` (requires `currentPassword`, `newPassword`)
9. Update profile: `GET/PUT /api/auth/profile` (fields: `fullName`, `dob`, `email`, `phone`)

## Architecture

### Backend structure
Each feature has a route file in `routes/` that maps URLs to controllers, then services, then repositories:

```
routes/      → Blueprint URL rules only
controllers/ → Request parsing, auth checks, response formatting
services/    → Business logic
repositories/→ DB queries (SQLAlchemy ORM)
models/      → SQLAlchemy model definitions
```

Database access: SQLAlchemy ORM via `extensions.db` (session-based, no raw connections).
AI calls: `config.init_chat_model()` uses `instructor` + OpenAI client pointed at `openrouter.ai/api/v1`, default model `openai/gpt-oss-120b:free`.

### Key API endpoints (non-obvious ones)

| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/api/auth/profile` | View/update profile (fullName, dob, email, phone) |
| PUT | `/api/auth/password` | Change password (`{currentPassword, newPassword}`) |
| POST | `/api/exams/<id>/clone` | Deep-copy exam + questions + answers |
| POST | `/api/exams/<id>/submissions/<sid>/comment` | Upsert teacher comment on student submission |
| GET | `/api/exams/<id>/export` | Download Excel of all results (teacher only) |
| GET | `/api/exams/<id>/export-pdf` | Download PDF exam paper (`?variants=1&duration=45`) |
| GET | `/api/exams/<id>/assignments` | Per-class assignment status for an exam |
| POST | `/api/questions/import-excel` | Parse Excel → return question array (not saved to DB) |
| GET | `/api/students/<id>/progress` | All exam scores ordered by submit date (for line chart) |
| GET | `/api/dashboard/student?all=true` | Student dashboard without date filter |
| GET | `/api/classes/<id>/exams` | Exams assigned to a class with completion stats |
| POST | `/api/classes/<id>/exams` | Assign exam to class (`{exam_id, deadline, time_limit, open_time}`) |
| PUT | `/api/classes/<id>/exams/<eid>` | Update exam assignment (deadline, time_limit, open_time) |
| DELETE | `/api/classes/<id>/exams/<eid>` | Unassign exam from class |
| GET | `/api/classes/<id>/students/export` | Export Excel danh sách học sinh |
| GET/POST | `/api/classes/<id>/announcements` | Thông báo lớp học |
| DELETE | `/api/announcements/<id>` | Xóa thông báo |
| GET/POST | `/api/students/<id>/relatives` | Danh sách / thêm người thân học sinh |
| PUT/DELETE | `/api/relatives/<id>` | Sửa / xóa người thân |
| GET/POST | `/api/question-bank` | Ngân hàng câu hỏi (có phân trang, tìm kiếm, lọc theo lesson) |
| POST | `/api/question-bank/import-excel` | Import câu hỏi vào ngân hàng từ Excel |
| GET | `/api/question-bank/sample-excel` | Tải file Excel mẫu |

### Frontend structure
- `src/config.js` — single `API_BASE = 'http://localhost:5000'` constant used by all API modules
- `src/api/index.js` — `apiFetch()` base function: attaches Bearer token, auto-unwraps `json.data`, throws on `success: false`
- `src/api/` — one file per domain:
  - `auth.js` — login, register, logout, getMe, changePassword, **getProfile**, **updateProfile**
  - `examService.js` — exam CRUD, submit, result, stats, export, export-pdf, assignments, **cloneExam**, **saveComment**
  - `questionService.js` — generateQuestions, **importQuestionsFromExcel** (FormData POST)
  - `questionBankService.js` — getQuestionBank (paginated), createBankQuestion, updateBankQuestion, deleteBankQuestion, importQuestionBankFromExcel, downloadSampleQuestionBank
  - `studentService.js` — student dashboard, teacher dashboard, AI advice, student results, **getStudentProgress**
  - `classService.js` — class CRUD, **getStudentsWithScores**, exportStudents, **getClassExams**, **assignExam**, **updateExamAssignment**, **unassignExam**
  - `lessonService.js` — lesson CRUD
  - `announcementService.js` — getAnnouncements, createAnnouncement, deleteAnnouncement
  - `relativeService.js` — getRelatives, addRelative, updateRelative, deleteRelative
- `src/context/AuthContext.jsx` — provides `{ user, setUser, loading }` via `useAuth()` hook
- `src/components/Toast.jsx` — re-exports `{ toast, ToastContainer }` from `react-toastify`; use `toast.success()`, `toast.error()` etc.
- Custom Tailwind component classes defined in `src/index.css`: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.card`, `.input`, `.badge-indigo`, `.badge-green`, `.badge-yellow`, `.badge-gray`, `.table-head`, `.table-row`, `.table-cell`

### Frontend routes (React Router v6)
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
- **Sidebar** (teacher): "Cập nhật hồ sơ" opens `ProfileModal`; "Đổi mật khẩu" opens `ChangePasswordModal`; nav includes "Ngân hàng câu hỏi" → `/question-bank`
- **StudentHome** (student): toggle "Theo tuần" / "Tất cả" controls date filter; lock icon opens `ChangePasswordModal`; `RelativesCard` shows and manages student relatives
- **LessonDetail** (teacher): each exam has Clone (`FiCopy`) + Assign (`FiSend`) + Stats + Edit + Delete + Export PDF buttons; ExamModal toolbar has "Import Excel" for batch question upload and "Chọn từ ngân hàng" to pick from question bank
- **ClassDetail** (teacher): assigned exams table + student roster + announcements card; "Xem bài" opens `StudentResultsModal` (progress line chart + per-exam detail + teacher comment textarea)
- **ExamResult** (student): shows teacher comment block if `result.teacherComment` is set
- **QuestionBank** (teacher): paginated list with search + filter by lesson; supports create, edit, delete, import from Excel

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
