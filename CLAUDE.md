# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

E-learning platform for Grade 3 Math (Vietnamese). Two separate sub-projects:
- `backend/` — Flask REST API, MySQL, Gemini AI
- `frontend/` — React 19 SPA (Vite, Tailwind CSS)

Two user roles: **teacher** (manages classes/lessons/exams, views dashboard) and **student** (takes exams, views weekly progress).

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py          # runs on http://localhost:5000
```
Requires a MySQL database and a `.env` file with `GEMINI_API_KEY`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SECRET_KEY`. Database schema is in `database/create_db.py`.

### Frontend
```bash
cd frontend
npm install
npm run dev            # Vite dev server, default port 5173
npm run build          # production build → dist/
npm run lint           # ESLint
```

## CORS and session cookies

`backend/app.py` allows origins: 5500, 8080, **5173** (Vite default). Add to this list if the frontend runs on a different port.

All frontend `fetch` calls use `credentials: 'include'`. Session cookies are set with `SESSION_COOKIE_SAMESITE="None"`, `SESSION_COOKIE_SECURE=False`.

## Architecture

### Auth flow
1. On app mount, `AuthContext` calls `GET /api/me` to restore session state
2. `RequireAuth` in `App.jsx` guards routes by `user.role` (`"teacher"` or `"student"`)
3. Single login form: tries `POST /api/auth/login/teacher`, falls back to `POST /api/auth/login/student`
4. Navigation after login: teacher → `/dashboard`, student → `/student`
5. Change password: `PUT /api/auth/password` (requires `currentPassword`, `newPassword`)

### Backend structure
Each feature is a Flask blueprint in `routes/`:
- `auth.py` — login/logout/session/change-password
- `classes.py` — class CRUD + stats + exam assignment per class
- `lesson.py` — lesson CRUD
- `exam.py` — exam CRUD + student submission + clone + teacher comments + Excel export
- `question.py` — AI question generation + Excel import
- `student.py` — student CRUD, bulk Excel upload, student dashboard (week filter or all), progress chart
- `dashboard.py` — teacher dashboard stats + AI advice

Database access: `utils.get_db()` returns a raw `mysql.connector` connection from a pool (no ORM).  
AI calls: `config.gemini_generate(prompt)` uses `google.genai` client with `models/gemini-2.5-pro`, requesting JSON responses.

### Key API endpoints (non-obvious ones)

| Method | Path | Description |
|--------|------|-------------|
| PUT | `/api/auth/password` | Change password (requires auth, body: `{currentPassword, newPassword}`) |
| POST | `/api/exams/<id>/clone` | Deep-copy exam + questions + answers |
| POST | `/api/exams/<id>/submissions/<sid>/comment` | Upsert teacher comment on a student's submission |
| GET | `/api/exams/<id>/export` | Download Excel of all results (teacher only) |
| GET | `/api/exams/<id>/assignments` | Per-class assignment status for an exam |
| POST | `/api/questions/import-excel` | Parse Excel file → return question array (not saved to DB) |
| GET | `/api/students/<id>/progress` | All exam scores ordered by submit date (for line chart) |
| GET | `/api/dashboard/student?all=true` | Student dashboard without date filter |
| GET | `/api/classes/<id>/exams` | Exams assigned to a class with completion stats |
| POST | `/api/classes/<id>/exams` | Assign exam to class (`{exam_id, deadline}`) |
| DELETE | `/api/classes/<id>/exams/<exam_id>` | Unassign exam from class |

### Frontend structure
- `src/config.js` — single `API_BASE = 'http://localhost:5000'` constant used by all API modules
- `src/api/` — one file per domain; all functions return parsed JSON, all use `credentials: 'include'`
  - `auth.js` — login, register, logout, getMe, **changePassword**
  - `examService.js` — exam CRUD, submit, result, stats, export, assignments, **cloneExam**, **saveComment**
  - `questionService.js` — generateQuestions, **importQuestionsFromExcel** (FormData POST)
  - `studentService.js` — fetchDashboard (supports `all=true`), teacher dashboard, AI advice, student results, **getStudentProgress**
  - `classService.js` — class CRUD, student management, **getClassExams**, **assignExam**, **unassignExam**
- `src/context/AuthContext.jsx` — provides `{ user, setUser, loading }` via `useAuth()` hook
- `src/components/Toast.jsx` — re-exports `{ toast, ToastContainer }` from `react-toastify`; use `toast.success()`, `toast.error()` etc.
- Custom Tailwind component classes defined in `src/index.css`: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.card`, `.input`, `.badge-indigo`, `.badge-green`, `.badge-yellow`, `.badge-gray`, `.table-head`, `.table-row`, `.table-cell`

### Frontend routes (React Router v6)
| Path | Component | Role |
|---|---|---|
| `/` | Login | public |
| `/dashboard` | Dashboard | teacher |
| `/manage-class` | ManageClass | teacher |
| `/class-detail/:classId` | ClassDetail | teacher |
| `/manage-lesson` | ManageLesson | teacher |
| `/lesson-detail/:lessonId` | LessonDetail | teacher |
| `/student` | StudentHome | student |
| `/student/exam/:examId` | StudentExam | student |
| `/exam-result/:examId` | ExamResult | student |

### Key UI behaviours
- **Sidebar** (teacher): "Đổi mật khẩu" button opens `ChangePasswordModal`
- **StudentHome** (student): toggle "Theo tuần" / "Tất cả" controls date filter; lock icon in header opens `ChangePasswordModal`
- **LessonDetail** (teacher): each exam has Clone (`FiCopy`) + Assign (`FiSend`) + Edit + Delete buttons; ExamModal toolbar has "Import Excel" for batch question upload
- **ClassDetail** (teacher): assigned exams table + student roster; "Xem bài" opens `StudentResultsModal` which shows a progress Line chart (if ≥2 submissions) + per-exam detail with teacher comment textarea
- **ExamResult** (student): shows teacher comment block if `result.teacherComment` is set

### Excel import format for questions (`POST /api/questions/import-excel`)
| Column | Required | Values |
|--------|----------|--------|
| `câu hỏi` | yes | Question text |
| `đáp án a` | yes | Answer A text |
| `đáp án b` | yes | Answer B text |
| `đáp án c` | yes | Answer C text |
| `đáp án d` | yes | Answer D text |
| `đáp án đúng` | yes | `a`, `b`, `c`, or `d` |
| `giải thích` | no | Explanation text |

Returns `{ success, data: [questions], errors: [string] }` — questions are NOT saved to DB, they are returned to the frontend to be added to the exam editor.
