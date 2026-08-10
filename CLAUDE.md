# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

E-learning platform for Grade 3 Math (Vietnamese). Two separate sub-projects:
- `backend/` — Node.js/Express REST API, MariaDB/MySQL, Gemini AI (via openai SDK)
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
src/utils/llm.utils.js      → LLM client factory (Gemini / endpoint tương thích OpenAI)
src/utils/date.utils.js     → Date helpers
src/constants/authority.js  → Role constants
src/config/env.js           → Typed env vars
src/config/database.js      → MariaDB connection pool
src/chat/                   → AI chatbot system (see below)
```

Database access: `mariadb` npm package, raw SQL, no ORM. `camelCaseResponse` middleware auto-converts snake_case DB column names to camelCase in JSON responses.  
Auth: `jsonwebtoken` (HS256, 24h) + `bcryptjs`. Token validated by `authenticate` middleware, populates `req.user`. Role checked by `authorize` middleware.  
Validation: `zod` schemas applied as Express middleware before controllers.  
AI calls: `openai` SDK trỏ vào lớp tương thích OpenAI của Gemini. `src/config/env.js` chọn nhà cung cấp: có `GEMINI_API_KEY` thì dùng Gemini (`GEMINI_MODEL`, mặc định `gemini-3.5-flash-lite`), không thì rơi về bộ `OPENAI_*` (mặc định OpenRouter). Phần còn lại của code chỉ đọc `env.AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` — đổi nhà cung cấp không phải sửa service. LLM client tạo ở `src/utils/llm.utils.js`.  
File uploads: `multer` for Excel imports.  
PDF generation: `pdfkit`.  
Excel: `xlsx` (SheetJS) for import and export.

Giới hạn lượt gọi (bậc miễn phí Gemini) — **quota tính theo project, không theo API key**:

| Model | RPM (đo thực tế) |
|---|---|
| `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite` | 15 |
| `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-flash-latest` | 5 |
| `gemini-2.5-pro` | 0 — luôn 429 |
| `gemini-2.5-flash` | không mở cho tài khoản mới — 404 |

Chi phí mỗi lượt: chat giáo viên câu thường **1 request**, có dùng tool **2–4** (1 lượt đầu + tối đa `MAX_LOOPS` vòng), chat học sinh 1, sinh 50 câu hỏi 5. Nên đụng 429 là bình thường, không phải sự cố.

`llm.utils.js` xử lý việc đó, có 2 chỗ dễ làm hỏng nếu sửa:
- **`maxRetries: 0` khi khởi tạo client là cố ý.** Lần thử lại của SDK bắn lại gần như tức thì và không đọc `RetryInfo`, nên ở mức 5 RPM nó chỉ đốt thêm một lượt gọi rồi vẫn 429. Việc thử lại do `createCompletion()` lo.
- **Vòng lặp agent gọi `streamChatWithTools`, không gọi 2 lượt như trước.** Lượt đầu đã là stream *có kèm tool*: model tự trả lời được thì token chạy ra ngay trong lượt đó, chọn tool thì không phát token nào. Đừng quay lại kiểu "dò tool trước rồi stream lại" — kiểu đó tốn 2 request cho mọi câu thường và bỏ đi đúng câu trả lời vừa sinh.
- **`mergeToolCallDeltas` phải giữ `extra_content`.** Gemini 3.x đính `thought_signature` trong đó và bắt buộc nhận lại nguyên vẹn ở lượt sau; làm rơi field này thì vòng tool thứ hai trả 400 `Function call is missing a thought_signature`. Hàm này cũng phải chịu được cả hai kiểu delta: Gemini gửi trọn tool call trong một delta không có `index`, còn OpenRouter chẻ `arguments` ra nhiều delta và đánh dấu bằng `index`.
- **`client.fetch` bị bọc lại để gỡ vỏ mảng của body lỗi.** Gemini trả `[{ "error": ... }]`, còn SDK openai chỉ đọc `{ "error": ... }` nên `err.error` thành `undefined` và log chỉ còn `429 status code (no body)` — mất luôn `RetryInfo.retryDelay`. Wrapper phải lấy `fetch` từ chính client (là `node-fetch`, hiểu option `agent`); dùng `fetch` global của Node thì `httpAgent` bị bỏ qua và request chết ở proxy công ty.

### AI Chatbot system (`src/chat/`)

```
src/chat/
  agent/
    teacher-agent.js    → Teacher-specific chat agent with tool calling
    student-agent.js    → Student-specific chat agent
  tools/
    registry.js         → Exports TEACHER_TOOLS, TOOL_LABELS, toolRegistry
    executor.js         → Executes tool calls by name
    search-question/       → search_question_bank
    save-question/         → save_questions_to_bank
    get-student-stats/     → get_student_stats
    get-student-progress/  → get_student_progress
    get-lessons/           → get_lessons
    get-classes/           → get_classes
    get-exams/             → get_exams
    create-exam/           → create_exam
    update-exam/           → update_exam
    delete-exam/           → delete_exam
    assign-exam/           → assign_exam_to_class
    unassign-exam/         → unassign_exam
    get-exam-stats/        → get_exam_stats
    create-announcement/   → create_announcement
```

Teacher agent has 14 AI tools. Each tool folder contains `definition.js` (OpenAI tool schema) và `handler.js` (execution logic). Chat route: `POST /api/chat`.

Lưu ý khi sửa phần chat:
- **SSE phải nghe `res.on('close')`, KHÔNG phải `req.on('close')`** (`chat.controller.js`). `'close'` của `req` bắn ngay khi đọc xong body — mà `express.json()` đã tiêu thụ hết body trước khi controller chạy — nên nghe ở đó thì lượt chat nào cũng tự `abort()` ở 0ms, rồi cả hai nhánh `if (aborted) return` bỏ qua `res.end()` khiến response treo vô hạn và frontend quay loading mãi.
- Tool nào cần ID (lesson_id, class_id, exam_id) thì phải để `required` trong `definition.js` **và** kiểm tra quyền sở hữu trong `handler.js`. Để "tuỳ chọn" thì model sẽ lặng lẽ bỏ qua rồi ghi dữ liệu thiếu — xem `save-question/handler.js`.
- Prompt hệ thống ở `src/prompts/teacher-system.md`; bảng "Khi nào dùng Tool" phải ghi rõ tool nào cần ID và phải gọi `get_lessons`/`get_classes`/`get_exams` trước.
- **`get_exams` là tool duy nhất trả về `exam_id`.** `get_lessons` chỉ trả `id/title/examCount` của *bài học*. Ngữ cảnh giữa các lượt chat chỉ giữ `{role, content}` (`chat.service.js`) — tool call và kết quả tool bị bỏ — nên nếu bỏ `get_exams` khỏi registry thì `update_exam`/`delete_exam`/`assign_exam_to_class`/`get_exam_stats` mất đường lấy ID, và model sẽ lặng lẽ `create_exam` một đề trùng thay vì sửa đề cũ.
- **`MAX_LOOPS` trong `teacher-agent.js` phải đủ cho chuỗi tool dài nhất.** "Giao cho lớp 3A một bài kiểm tra 5 câu" cần 4 vòng tuần tự (`get_classes` → `get_lessons` → `create_exam` → `assign_exam_to_class`). Đặt trần 3 thì đề được tạo mà không được giao, đồng thời vòng lặp thoát lúc model vẫn đòi gọi tool nên không có chữ nào → chatbot im lặng, và `chat.service` không lưu message rỗng nên lượt sau mất luôn ngữ cảnh. Hết vòng lặp thì phải `history.pop()` lượt đòi-gọi-tool (mỗi `tool_call` bắt buộc có kết quả đi kèm ngay sau) rồi gọi lại **không kèm tool** để buộc ra câu trả lời.

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
| GET/POST | `/api/question-bank` | Ngân hàng câu hỏi (có phân trang, tìm kiếm, lọc theo lesson). `lessonId` **bắt buộc** khi tạo/sửa |
| DELETE | `/api/question-bank` | Xóa nhiều câu hỏi (`{ids: []}`, tối đa 500) → `{deleted, requested}` |
| POST | `/api/question-bank/generate` | AI soạn câu hỏi, **chưa lưu** (`{lessonId, numQuestions, description}`, tối đa 50) |
| POST | `/api/question-bank/batch` | Lưu hàng loạt câu hỏi đã xem lại (`{lessonId, questions}`) |
| POST | `/api/question-bank/import-excel` | Import câu hỏi vào ngân hàng từ Excel (cần `lessonId`) |
| GET | `/api/question-bank/sample-excel` | Tải file Excel mẫu |

`/api/question-bank/generate` chia yêu cầu thành nhiều nhóm 10 câu gọi song song (`AI_CHUNK_SIZE` trong `question-bank.service.js`) — xin thẳng 50 câu trong một lệnh gọi sẽ vượt timeout 60s của SDK và treo. Dùng `Promise.allSettled` nên một nhóm hỏng vẫn giữ được phần còn lại; kết quả được lọc bỏ câu sai định dạng và khử trùng lặp, nên **thường trả về ít hơn số yêu cầu** (50 → ~40 là bình thường).

### Frontend structure
- `src/config.js` — single `API_BASE = 'http://localhost:5000'` constant used by all API modules
- `src/api/index.js` — axios instance with interceptors: attaches Bearer token, auto-unwraps `json.data`, throws on `success: false`. Also exports `downloadBlob(blob, filename)`.
- `src/api/` — one file per domain:
  - `auth.js` — login, register, logout, getMe, changePassword, getProfile, updateProfile
  - `examService.js` — exam CRUD, submit, result, stats, export, export-pdf, assignments, cloneExam, saveComment
  - `questionService.js` — generateQuestions, importQuestionsFromExcel (FormData POST)
  - `questionBankService.js` — getQuestionBank (paginated), createBankQuestion, updateBankQuestion, deleteBankQuestion, deleteBankQuestions (xóa nhiều), generateBankQuestions (AI), saveBankQuestionsBatch, importQuestionBankFromExcel, downloadSampleQuestionBank
  - `studentService.js` — student dashboard, teacher dashboard, AI advice, student results, getStudentProgress
  - `classService.js` — class CRUD, getStudentsWithScores, exportStudents, getClassExams, assignExam, updateExamAssignment, unassignExam
  - `lessonService.js` — lesson CRUD
  - `announcementService.js` — getAnnouncements, createAnnouncement, deleteAnnouncement
  - `relativeService.js` — getRelatives, addRelative, updateRelative, deleteRelative
- `src/context/AuthContext.jsx` — chỉ export component `AuthProvider` (giữ được Fast Refresh)
- `src/context/auth-context.js` — export `AuthContext` + hook `useAuth()` trả về `{ user, setUser, loading }`. **Import `useAuth` từ file này**, không phải từ `AuthContext.jsx`. Tên đặt kebab-case để không đụng `AuthContext.jsx` trên filesystem không phân biệt hoa/thường (macOS, Windows)
- Toast: import `{ toast }` straight from `react-toastify`; `<ToastContainer />` is mounted in `src/main.jsx`
- `src/layouts/TeacherLayout.jsx` — layout wrapper for all teacher pages (sidebar + main content)
- `src/components/ErrorBoundary.jsx` — React error boundary for graceful error handling
- `src/components/Sidebar.jsx` — teacher sidebar navigation
- `src/components/Pagination.jsx` — shared pager (page / pages / onChange)
- `src/components/shared/ChatBot.jsx` — AI chatbot UI (floating button, conversation panel); available to **both** roles

### UI components (shadcn/ui)

The UI is built on **shadcn/ui** with Tailwind CSS 4. There are no hand-written `.btn-*` / `.card` / `.input` / `.badge-*` / `.table-*` classes any more — use the components:

| Need | Component | Notes |
|---|---|---|
| Button | `@/components/ui/button` | `variant`: `gradient` (nút chính của dự án), `outline`, `destructive`, `ghost`, `default`, `secondary`, `link`. Nút chỉ có icon: `size="icon-xs" \| "icon-sm" \| "icon"` |
| Badge | `@/components/ui/badge` | `variant`: `success`, `danger`, `warning`, `info`, `neutral` (pastel, riêng của dự án) + các variant gốc |
| Card | `@/components/ui/card` | Đã gắn `shadow-soft` + hover lift. Dùng `className="p-5 gap-0"` cho card gọn, thêm `hover:translate-y-0` khi không muốn hiệu ứng nhấc lên |
| Alert | `@/components/ui/alert` | Banner cảnh báo. `variant`: `success`, `danger`, `warning`, `info` (pastel, cùng bảng màu Badge) + `default`, `destructive` |
| Form | `input`, `textarea`, `select`, `checkbox`, `radio-group`, `label` | |
| Modal | `@/components/ui/dialog` | Có sẵn focus trap, Escape, ARIA — **đừng tự dựng `fixed inset-0`** |
| Hỏi xác nhận | `@/components/ui/alert-dialog` | Thay cho `confirm()` native — xem `ManageClass.jsx` (xóa lớp) |
| Tab | `@/components/ui/tabs` | Chọn vai trò ở `Register.jsx` |
| Avatar | `@/components/ui/avatar` | Chữ cái đầu của lớp/học sinh. Dự án dùng squircle: `className="rounded-xl"` cho cả `Avatar` lẫn `AvatarFallback` |
| Cuộn | `@/components/ui/scroll-area` | Vùng tin nhắn ChatBot, stack trace ErrorBoundary |
| Loading danh sách | `@/components/ui/skeleton` | Dùng cho danh sách/lưới; spinner `FiLoader` chỉ dùng trong nút đang xử lý |
| Bảng | `@/components/ui/table` | |
| Biểu đồ | `@/components/ui/chart` (recharts) | `ChartContainer` + `ChartTooltip`/`ChartTooltipContent`. Màu series khai qua `config` → dùng lại bằng `var(--color-<dataKey>)`. Xem `ScoreChart.jsx` (Area) và `Dashboard.jsx` (Bar, RadialBar) |

Quy ước quan trọng:
- Path alias `@/` → `frontend/src/` (khai báo ở `vite.config.js` + `jsconfig.json`)
- `cn()` trong `src/lib/utils.js` để gộp class (clsx + tailwind-merge)
- Theme tokens (`--primary`, `--border`, `--shadow-soft`…) nằm trong `@theme` ở `src/index.css`; **không có `tailwind.config.js`** (Tailwind 4)
- Thêm component mới: `npx -p shadcn@latest -- shadcn add <tên> --yes`
- File trong `src/components/ui/` thuộc quyền sở hữu của repo — sửa trực tiếp được, và `eslint.config.js` có override riêng cho thư mục này
- Radix `Select` **không nhận `value=""`** — dùng sentinel (`'all'` cho bộ lọc) rồi map lại, xem `QuestionBank/index.jsx`; trường bắt buộc thì để `value={undefined}` + `<SelectValue placeholder="..." />`, xem `QuestionBank/QuestionFormModal.jsx`
- Radix `ScrollArea` bọc children trong một div nội bộ, nên `space-y-*` phải đặt ở div con tự khai báo chứ không đặt trên `ScrollArea`
- Không còn `<button>` / `<div>` dựng card thủ công trong `src/` — mọi thứ đi qua component ở `src/components/ui/`

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
- **QuestionBank** (teacher): paginated list with search + filter by lesson; supports create, edit, delete, import from Excel. Checkbox mỗi câu + "Chọn tất cả trang này" để xóa nhiều (lựa chọn bị xóa khi đổi trang/tìm kiếm/lọc). Nút "Tạo bằng AI" mở `AiGenerateModal` (2 bước: nhập yêu cầu → xem lại & chọn câu → lưu). **Mọi câu hỏi bắt buộc có chủ đề** — không còn mục "Chưa phân loại"
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
