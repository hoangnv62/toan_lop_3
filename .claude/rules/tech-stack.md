# Tech Stack — Toán Lớp 3

> Source of truth for ALL tool recommendations. Claude must check this before suggesting any library or pattern.

---

## Backend Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Runtime** | Node.js (LTS) | ESM modules (`"type": "module"`) |
| **Language** | JavaScript | No TypeScript |
| **Framework** | Express.js 5 | |
| **Database** | MariaDB / MySQL | Raw SQL via `mariadb` npm package, NO ORM |
| **ORM / Query Builder** | None | Raw parameterized SQL only |
| **Cache** | None | |
| **Queue** | None | |
| **Auth** | JWT (HS256, 24h) + bcryptjs | Single access token stored in localStorage |
| **File Storage** | Local disk | multer for uploads (Excel, images) |
| **Email** | None | |
| **API Style** | REST | JSON response envelope `{ success, data, message }` |
| **API Docs** | None | |
| **Logging** | console | No structured logger |
| **Monitoring** | None | |
| **Testing** | None set up | |
| **Deploy** | TBD | |
| **AI / LLM** | openai SDK → Gemini (lớp tương thích OpenAI) | Model: `gemini-3.5-flash-lite` (15 RPM bậc miễn phí). Đặt `GEMINI_API_KEY` để dùng Gemini; bỏ trống thì rơi về `OPENAI_*` (OpenRouter) |
| **PDF** | pdfkit | Exam PDF export |
| **Excel** | xlsx (SheetJS) | Import questions, export results |
| **Validation** | Zod | Applied as Express middleware |

---

## Frontend Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | React 19 + Vite | SPA only |
| **Language** | JavaScript | No TypeScript |
| **Styling** | Tailwind CSS 4 | Theme tokens via `@theme` in `src/index.css` — no `tailwind.config.js` |
| **Component Library** | shadcn/ui (JavaScript, `tsx: false`) | Components live in `src/components/ui/`, owned by the repo — edit them directly |
| **Component primitives** | `radix-ui` (umbrella package) | Pulled in by shadcn components |
| **Component utils** | class-variance-authority, clsx, tailwind-merge | `cn()` helper in `src/lib/utils.js` |
| **Global State** | React Context (AuthContext) | No Zustand/Redux |
| **Server State / Data Fetching** | axios + useState | No TanStack Query |
| **Forms** | Controlled components | No React Hook Form |
| **Validation** | None (client-side) | Backend validates with Zod |
| **Animation** | tw-animate-css | Required by shadcn Dialog/Select transitions |
| **Auth (client-side)** | Custom JWT (localStorage) | `src/api/index.js` axios instance |
| **API Client** | axios | Interceptors in `src/api/index.js` |
| **Charts** | recharts (qua `@/components/ui/chart` của shadcn) | Cần `react-is` cài tường minh — npm 6 không tự kéo peer dep |
| **Icons** | react-icons/fi | Feather icons only |
| **Notifications** | react-toastify | `toast.success()`, `toast.error()` etc. |
| **Markdown** | react-markdown + remark-gfm | Used in chatbot responses |
| **Routing** | React Router v7 | |
| **Testing** | None set up | |
| **Deploy** | TBD | |

---

## Integration

| | Detail |
|--|--------|
| **Repo structure** | Separate `backend/` and `frontend/` folders in same repo |
| **Monorepo tool** | None |
| **API base URL (dev)** | `http://localhost:5000` (set in `frontend/src/config.js`) |
| **Auth token storage** | localStorage (`auth_token` key) |
| **Shared types** | None — no TypeScript, no shared package |
| **Path alias** | `@/` → `frontend/src/` (declared in `vite.config.js` + `jsconfig.json`) |
| **CI/CD** | None set up |

---

## Architecture Pattern

**Backend:** Layered — Route → Middleware → Controller → Service → Repository → DB

**Frontend:** SPA — Pages in `src/pages/`, shared components in `src/components/`, one API file per domain in `src/api/`

---

## Project Context

| | Detail |
|--|--------|
| **Domain** | E-learning, Grade 3 Math (Vietnamese) |
| **Users** | Teachers + Students (grade 3, ~8 years old) |
| **Scale expectation** | Small — single school or district |
| **SEO required?** | No (requires login) |
| **Special requirements** | Vietnamese language UI, Excel import/export, AI chatbot with tool calling for teachers |

---

## Decision Log

| Date | Decision | Reason |
|------|---------|--------|
| Project start | JavaScript (not TypeScript) | Faster development, small team |
| Project start | Raw SQL (not ORM) | Direct control, MariaDB-specific queries |
| Project start | localStorage for JWT | Simple SPA, acceptable for internal school tool |
| Recent | OpenRouter AI via openai SDK | Free model access for AI features |
| 2026-07-28 | Tailwind CSS 3 → 4 | shadcn/ui mặc định nhắm v4; cấu hình chuyển vào `@theme` trong CSS |
| 2026-07-28 | shadcn/ui thay bộ class tự chế | Bỏ 15 class trong `index.css`; có sẵn a11y (focus trap, ARIA) cho modal |
| 2026-07-28 | Giữ react-toastify, react-icons/fi | Không đổi sang Sonner/lucide để giảm phạm vi thay đổi |
| 2026-07-28 | Bổ sung alert, alert-dialog, avatar, scroll-area, skeleton, tooltip, tabs | Quét hết markup thô còn lại: `confirm()` native → AlertDialog, div dựng card → Card, `<button>` → Button |
| 2026-07-28 | Đáp án bài thi học sinh dùng RadioGroup | Đúng ngữ nghĩa chọn-một, có sẵn điều hướng bàn phím thay vì list `<button>` |
| 2026-07-29 | chart.js → recharts + shadcn chart | Dùng chung hệ component shadcn; màu series đi qua token `--chart-*` |
| 2026-07-29 | Phân bố điểm dùng ordinal ramp indigo, không phải 4 hue rời | Khoảng điểm là thang có thứ tự; ramp đã qua `validate_palette.js --ordinal` |
| 2026-07-29 | Tỉ lệ đạt: pie 2 lát → RadialBar (meter) | Một tỉ lệ duy nhất thì meter đúng hơn pie; con số ở giữa mới là nội dung chính |
| 2026-08-10 | OpenRouter → Gemini | Dùng lớp tương thích OpenAI của Google nên giữ nguyên openai SDK |
| 2026-08-10 | Chọn `gemini-3.5-flash-lite`, không phải `gemini-3.6-flash` | Đo thực tế: lite được 15 RPM so với 5 RPM, nhanh hơn ~3.7x (4.8s vs 17.7s cho 3 nhóm 10 câu), mà chất lượng không tụt (30/30 câu hợp lệ, chọn tool giống hệt trên 4 ca thử) |
| 2026-08-10 | Chat giáo viên: stream kèm tool ngay lượt đầu | Bỏ lượt "dò tool" riêng — câu thường từ 2 request xuống 1 (nửa ngân sách 15 RPM), câu chốt sau tool giờ cũng chạy chữ dần thay vì đổ ra một cục |
| 2026-08-10 | Tự thử lại theo `RetryInfo.retryDelay`, tắt retry của SDK | Ở 5–15 RPM thì backoff cứng 0.5s/1s không đủ (Google đòi chờ 5–45s), còn retry của SDK bắn lại ngay và đốt thêm quota |
