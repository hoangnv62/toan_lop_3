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
3. Teacher login: username + password via `POST /api/auth/login/teacher`
4. Student login: two-step — phone check (`POST /api/auth/check-phone`) then password (`POST /api/auth/login/student`)

### Backend structure
Each feature is a Flask blueprint in `routes/`:
- `auth.py` — login/logout/session
- `classes.py` — class CRUD + stats
- `lesson.py` — lesson CRUD
- `exam.py` — exam CRUD + student submission
- `question.py` — AI question generation
- `student.py` — student CRUD, bulk Excel upload, student dashboard
- `dashboard.py` — teacher dashboard stats + AI advice

Database access: `utils.get_db()` returns a raw `mysql.connector` connection from a pool (no ORM).  
AI calls: `config.gemini_generate(prompt)` uses `google.genai` client with `models/gemini-2.5-pro`, requesting JSON responses.

### Frontend structure
- `src/config.js` — single `API_BASE = 'http://localhost:5000'` constant used by all API modules
- `src/api/` — one file per domain; all functions return parsed JSON, all use `credentials: 'include'`
- `src/context/AuthContext.jsx` — provides `{ user, setUser, loading }` via `useAuth()` hook
- `src/components/Toast.jsx` — re-exports `{ toast, ToastContainer }` from `react-toastify`; use `toast.success()`, `toast.error()` etc.
- Custom Tailwind component classes defined in `src/index.css`: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.card`, `.input`

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
