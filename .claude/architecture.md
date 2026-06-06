# Kiến trúc tổng thể

## Stack

| Tầng | Công nghệ |
|------|-----------|
| Backend | Node.js ESM, Express 5, MariaDB (raw SQL), OpenRouter AI |
| Frontend | React 19, Vite, Tailwind CSS, React Router v6, Axios |
| Auth | JWT HS256 (24h), stateless |
| AI | openai SDK → OpenRouter (`openrouter.ai/api/v1`) |

---

## Cấu trúc thư mục backend

```
backend/
  index.js                    ← Bootstrap, middleware, route registration
  src/
    routes/                   ← URL rules only, không chứa logic
    controllers/              ← Parse request, call service, format response
    services/                 ← Business logic
    repositories/             ← Raw SQL queries
    middleware/               ← authenticate, asyncHandler, errorHandler, camelCaseResponse, upload
    validation/               ← Zod schemas + validate() factory
      schema/                 ← Zod schema definitions
    utils/                    ← error.utils.js, llm.utils.js, date.utils.js, response.js
    config/                   ← env.js, database.js
    chat/                     ← Chat system (xem phần Chat Architecture)
      agent/
      tools/
    modules/                  ← Domain modules dùng chung giữa REST và Chat
      question-bank/
      student/
    prompts/                  ← System prompt files (.md)
```

---

## Request lifecycle (REST API)

```
HTTP Request
  → CORS, express.json(), camelCaseResponse (global middleware)
  → Route: URL matching + validate middleware
  → authenticate middleware (nếu route cần auth) → req.user
  → asyncHandler(controller)
  → controller: parse req, call service, res.json()
  → service: business logic, call repository, throw AppError
  → repository: raw SQL via pool
  ← camelCaseResponse tự convert snake_case → camelCase trong response JSON
  ← errorHandler: bắt AppError → HTTP status + { success: false, message }
```

---

## Chat Architecture (Teacher Agent)

Business logic **chỉ viết một lần** trong Domain Service.
REST API, Chatbot và MCP đều gọi cùng Domain Service.

```
User (teacher)
  ↓
Chat Controller
  ↓
Chat Service
  ↓
Teacher Agent  ←────────────────────────────────────────┐
  ↓                                                      │
LLM (Call 1, non-streaming)                             │
  ↓                                                      │
Tool Call detected?                                      │
  ├── Không → Stream response                            │
  └── Có ──→ Tool Executor                              │
                ↓                                        │
            Tool Registry (lookup by name)              │
                ↓                                        │
            Tool Handler (validate Zod)                  │
                ↓                                        │
            Domain Service (business logic)              │
                ↓                                        │
            Repository → DB                             │
                ↓                                        │
            Tool Result ─────────────────────────────────┘
  ↓
LLM (Call 2, streaming) → Stream final response
```

Giới hạn: tối đa 3 vòng tool loop, timeout 30s.

---

## Tương lai: MCP Ready

Khi cần MCP server, chỉ thêm một lớp mới gọi vào Domain Service:

```
REST API → Controller → QuestionBankService → Repository → DB
Chatbot  → ToolHandler → QuestionBankService → Repository → DB
MCP Tool → MCP Handler → QuestionBankService → Repository → DB
```

Không phải sửa logic hiện có.

---

## SSE Protocol (Chat streaming)

```
# Tool đang chạy:
event: tool_start
data: {"tool": "search_question_bank", "label": "Đang tìm câu hỏi..."}

# Tool xong:
event: tool_done
data: {"tool": "search_question_bank"}

# Text token:
data: {"token": "..."}

# Kết thúc:
data: [DONE]
```

---

## Auth flow

1. Login → server trả JWT token
2. Frontend lưu vào `localStorage` key `auth_token`
3. Mọi request đính kèm `Authorization: Bearer <token>`
4. `authenticate` middleware decode → populate `req.user: { user_id, role, name }`
5. Logout: xóa token client-side (stateless, không có server session)

---

## Frontend structure

```
frontend/src/
  api/
    index.js          ← Axios instance + interceptors + setToken/getToken
    *.service.js      ← Thin wrappers per domain
  context/
    AuthContext.jsx   ← useAuth() hook → { user, setUser, loading }
  components/
    shared/           ← ChatBot.jsx, Toast.jsx
    TeacherLayout.jsx ← Sidebar + main + ChatBot
    Modal.jsx
  pages/
    teacher/          ← Dashboard, ManageClass, ManageLesson, QuestionBank, ...
    student/          ← StudentHome, StudentExam, ExamResult
  config.js           ← API_BASE = 'http://localhost:5000'
  index.css           ← Custom Tailwind component classes
  App.jsx             ← React Router v6 + RequireAuth
```
