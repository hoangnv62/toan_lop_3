# Security Rules — Fullstack

## CRITICAL — Never Violate These (Both Layers)

- **Never** hardcode secrets, API keys, passwords, or tokens in source code
- **Never** commit `.env` files to version control (`.env` is gitignored; `.env.example` is committed)
- **Never** log sensitive data (passwords, tokens, PII)
- **Never** use `eval()` or `Function()` with user input
- **Always** validate and sanitize all user inputs on the **backend** with Zod

> Frontend has no validation library — all security validation happens on the backend.

---

## Backend Security

### Input Validation
```js
// Validate all incoming data with Zod before the controller runs
const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(6).max(128),
});

// Applied via validate() middleware in route:
router.post('/login', validate(loginSchema), login);
```

### Authentication (Actual Implementation)
- Single JWT token, 24h expiry (HS256), stored in client localStorage
- `authenticate` middleware: verifies token, sets `req.user = { id, role }`
- No refresh token mechanism — on expiry the user logs in again

```js
// bcryptjs — password hashing
const hashed = await bcrypt.hash(password, 10);
const match = await bcrypt.compare(password, hashed);
```

### Authorization
```js
// Check role on every protected route
router.delete('/exams/:id', authenticate, authorize(TEACHER), asyncHandler(deleteExam));

// Verify resource ownership in service/controller when needed
if (exam.teacherId !== req.user.id) throw new ForbiddenError('Access denied');
```

### SQL Injection Prevention
- **Always use parameterized queries** — `conn.query('SELECT ... WHERE id = ?', [id])`
- Never concatenate user input into SQL strings

### HTTP Security Headers
```js
// index.js — already set up
import helmet from 'helmet';
app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
```

### Rate Limiting
- Not currently implemented — consider adding for auth endpoints if deployed publicly

---

## Frontend Security

### XSS Prevention
```jsx
// react-markdown renders AI/chatbot output safely
// Never use dangerouslySetInnerHTML with user-supplied content
// Exception: if needed, sanitize with DOMPurify first
```

### Token Storage (Current Approach)
- JWT stored in `localStorage` under key `auth_token`
- Acceptable for this internal school tool — users are teachers/students on trusted devices
- Token attached via axios request interceptor in `src/api/index.js`

```js
// src/api/index.js
api.interceptors.request.use((config) => {
  const token = getToken(); // localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Auth Guard
```jsx
// App.jsx — RequireAuth component
function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Đang tải...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
```

### Environment Variables
```js
// Frontend: Vite exposes only VITE_ prefixed vars to the browser
// API base URL is hardcoded in src/config.js (not an env var)
// Never put secrets in frontend code
```

---

## Fullstack Auth Flow (Actual)

```
1. User submits credentials → POST /api/auth/login
2. Backend validates, returns { success: true, data: { token, user } }
3. Frontend stores token in localStorage via setToken()
4. Each request: Authorization: Bearer <token> (via axios interceptor)
5. On 401: user is redirected to login page, token cleared
6. On logout: token cleared from localStorage (server has no session to destroy)
7. On app load: token from localStorage → GET /api/auth/me → restore user state
```

---

## Dependency Security

```bash
npm audit          # Check for vulnerabilities
npm audit fix      # Auto-fix safe upgrades
```

---

## Security Checklist (Pre-deploy)

**Backend:**
- [ ] All inputs validated with Zod before reaching controllers
- [ ] Passwords hashed with bcryptjs (≥ 10 rounds)
- [ ] JWT 24h expiry enforced
- [ ] `authenticate` on all protected routes
- [ ] `authorize` on teacher-only routes
- [ ] All raw SQL uses `?` parameterization
- [ ] Helmet.js enabled
- [ ] CORS restricted to known frontend origin
- [ ] No secrets in code or logs
- [ ] `.env` not committed to git

**Frontend:**
- [ ] No secrets in client-side code
- [ ] Auth guard on all role-protected routes
- [ ] User-generated HTML not rendered with `dangerouslySetInnerHTML` (or sanitized)
- [ ] `npm audit` passes with 0 high/critical
