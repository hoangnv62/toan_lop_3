# Project Structure

> This project uses **separate `backend/` and `frontend/` folders** in a single repo — no Turborepo, no pnpm workspaces, no shared packages.  
> See `tech-stack.md` for the full technology list.

---

## Fullstack Architecture Overview

```
Browser / Mobile Client
        ↓  HTTP / WebSocket
[ Frontend ]  →  components, routing, state, forms
        ↓  REST / GraphQL / tRPC / Server Actions
[ Backend API ]  →  routes, controllers, services, auth
        ↓
[ Domain / Business Logic ]
        ↓
[ Infrastructure ]  →  database, cache, queue, storage, email
```

---

## This Project's Structure

```
toan_lop_3/                  ← Repo root
├── CLAUDE.md                ← Project-wide guidance for Claude
├── .claude/                 ← Claude config (agents, rules, commands, skills)
├── backend/                 ← Node.js/Express REST API
│   ├── index.js             # Entry point
│   ├── package.json         # ESM, no TypeScript
│   ├── database/
│   │   └── create_db.js     # Schema DDL
│   └── src/
│       ├── config/          # env.js, database.js
│       ├── constants/       # authority.js (roles)
│       ├── routes/          # URL rules only
│       ├── controllers/     # HTTP parsing + response
│       ├── services/        # Business logic
│       ├── repositories/    # Raw SQL
│       ├── middleware/      # auth, authorize, asyncHandler, errorHandler, camelcase, upload
│       ├── validation/      # Zod schemas + validate middleware
│       ├── utils/           # error.utils, response, llm.utils, date.utils
│       └── chat/            # AI chatbot (agent/, tools/)
└── frontend/                ← React 19 SPA
    ├── package.json         # Vite, no TypeScript
    └── src/
        ├── config.js        # API_BASE constant
        ├── App.jsx          # Routes + RequireAuth
        ├── main.jsx
        ├── index.css        # Tailwind + custom classes
        ├── context/         # AuthContext
        ├── api/             # axios calls per domain
        ├── components/      # Shared UI + TeacherLayout + ChatBot
        └── pages/           # teacher/ and student/ pages
```

---

## Backend Layer Responsibilities

```
Request → [ Routes ] → [ Middleware ] → [ Controllers ] → [ Services ] → [ Repositories ] → DB
```

| Layer | Owns | Must NOT |
|-------|------|---------|
| **Routes** | URL mapping, method binding | Contain logic |
| **Middleware** | Auth, validation, logging, rate-limit | Know about business rules |
| **Controllers** | Parse request, call service, format response | Contain business logic |
| **Services** | Business rules, orchestration | Know about HTTP or DB details |
| **Repositories** | Data access, queries | Contain business logic |

---

## Frontend Layer Responsibilities

```
Page → [ Feature Module ] → [ API Layer ] → Backend
              ↓
      [ Shared Components ]
```

| Layer | Owns | Must NOT |
|-------|------|---------|
| **Pages / Routes** | Layout, data fetching (SSR/SSG) | Business logic |
| **Feature Modules** | Feature components, hooks, state | Know other features' internals |
| **Shared Components** | Reusable UI primitives | Make API calls directly |
| **API Layer** | All HTTP calls, response mapping | Import UI components |

---

## Shared Code (Monorepo)

When using a monorepo, put in `packages/types/`:
- API request/response type definitions
- Zod schemas shared between frontend validation and backend validation
- Enum values used on both sides

```ts
// packages/types/src/user.ts
export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}
```

---

## File Naming Conventions

**Backend (JS/TS)**: `kebab-case.ts` — `user-service.ts`, `auth-middleware.ts`  
**Frontend Components**: `PascalCase.tsx` — `UserList.tsx`, `LoginForm.tsx`  
**Frontend Hooks**: `camelCase.ts` prefixed `use` — `useAuth.ts`, `useTasks.ts`  
**Shared utilities**: `camelCase.ts` — `utils.ts`, `constants.ts`  
**Tests**: `[name].test.ts(x)` (unit/integration), `[name].spec.ts` (E2E)

---

## Environment Files

```
.env                ← Root dev (gitignored)
.env.example        ← Template committed to git
apps/backend/.env   ← Backend-specific (gitignored)
apps/frontend/.env.local ← Frontend-specific (gitignored)
```

Key variables to coordinate:
```bash
# Backend
PORT=3001
DATABASE_URL=...
JWT_SECRET=...
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```
