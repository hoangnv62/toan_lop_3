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
GEMINI_API_KEY=
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=elearning_math_db
SECRET_KEY=
```

## Architecture

### Request lifecycle
1. `app.py` registers 7 blueprints — all routes are prefixed `/api/`
2. Protected routes use `@require_auth` from `utils.py` — validates `Authorization: Bearer <token>` header and populates `flask.g.user` with `{user_id, role, name}`
3. Database access via `utils.get_db()` — returns a connection from a pool of 5 (`MySQLConnectionPool`, pool_name `"mathpool"`)
4. AI calls via `config.gemini_generate(prompt)` — uses `google.genai` client, model `models/gemini-2.5-pro`, forces JSON response mode

### Auth system
- Stateless JWT (HS256, 24-hour expiry). No server-side sessions — the logout endpoint is a no-op.
- Teacher login: `POST /api/auth/login/teacher` — username + password
- Student login is two-step: `POST /api/auth/check-phone` → `POST /api/auth/login/student` (phone number as identifier, password optional on first login)
- Passwords: Werkzeug PBKDF2 hashing with legacy plaintext fallback in `verify_password()`

### Blueprint → URL prefix map
| File | Blueprint var | URL prefix |
|---|---|---|
| routes/auth.py | auth_bp | /api/auth |
| routes/classes.py | classes_bp | /api/classes |
| routes/lesson.py | lesson_bp | /api/lessons |
| routes/exam.py | exam_bp | /api/exams, /api/lessons |
| routes/question.py | question_bp | /api/questions |
| routes/student.py | student_bp | /api/classes, /api/students |
| routes/dashboard.py | dashboard_bp | /api/dashboard |

### AI integration
Two uses of Gemini:
- **Question generation** (`routes/question.py`): takes `numQuestions`, `lessonTitle`, `examDescription` → returns JSON array of 4-option MCQ objects
- **Teaching advice** (`routes/dashboard.py`): analyzes class score distribution → returns 3 Vietnamese teaching tips; falls back to hardcoded advice on failure

Both use `config.gemini_generate()`. Raw response is cleaned via `utils.clean_json_string()` (regex strips markdown fences).

### API response conventions
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "..." }
```
Auth endpoints also return `"token"` in the response body. Status codes: 200/201 success, 400 bad request, 401 unauthorized, 404 not found, 409 conflict, 500 server error.

## Known issues / gotchas

- **`routes/__init__.py`** duplicates `get_db()` and `clean_json_string()` from `utils.py` — use the `utils` versions when adding new code
- **Schema vs code mismatch:** `database/create_db.py` defines `questions.question_text` but code queries `questions.content`; `students` table has `teacher_id` in schema but code also references `class_id` — verify actual DB columns before writing new queries
- **`exam_sets` table** is defined in create_db.py but never used; all exam logic goes through `exams` directly
- The `classes` table is referenced extensively in code but has no explicit `CREATE TABLE` in `create_db.py`
