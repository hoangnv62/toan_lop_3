# Testing Standards — Fullstack

> **Current status:** No test suite is set up in this project (no Vitest, Jest, Playwright, or Supertest configured). The patterns below are targets for when testing is added.

## Testing Pyramid

```
              [ E2E Tests ]            ← Few — full user flow, browser + real backend
          [ Integration Tests ]        ← Some — API routes + DB; component + API
      [ Unit Tests ]                   ← Many — pure functions, services
```

## Coverage Requirements (target when tests are added)

- Unit test coverage: **minimum 80%**
- All new features must have tests
- All bug fixes must have a regression test

---

## Backend Testing

### File Organization
```
tests/
├── unit/
│   └── services/user-service.test.ts
├── integration/
│   └── routes/users.test.ts          ← real DB, real HTTP
└── fixtures/
    └── factories.ts                  ← test data builders
```

### Unit Test — Service (Vitest)
```ts
import { describe, it, expect, vi } from 'vitest';
import { UserService } from '@/domain/services/user.service';

describe('UserService.findById', () => {
  it('should return user when found', async () => {
    const mockRepo = { findById: vi.fn().mockResolvedValue({ id: '1', email: 'a@b.com' }) };
    const service = new UserService(mockRepo as any);

    const result = await service.findById('1');

    expect(result.email).toBe('a@b.com');
    expect(mockRepo.findById).toHaveBeenCalledWith('1');
  });

  it('should throw when user not found', async () => {
    const mockRepo = { findById: vi.fn().mockResolvedValue(null) };
    const service = new UserService(mockRepo as any);

    await expect(service.findById('999')).rejects.toThrow('User not found');
  });
});
```

### Integration Test — API Route (Supertest or similar)
```ts
import request from 'supertest';
import app from '@/app';

describe('GET /api/v1/users/:id', () => {
  it('returns 200 with user data', async () => {
    const res = await request(app)
      .get('/api/v1/users/1')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/v1/users/99999')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(404);
  });
});
```

---

## Frontend Testing

### File Organization
```
tests/
├── unit/
│   └── hooks/useTasks.test.ts
├── integration/
│   └── features/tasks/TaskList.test.tsx
└── e2e/
    ├── auth-flow.spec.ts
    └── task-management.spec.ts
```

### Unit Test — Custom Hook (Vitest + Testing Library)
```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { vi } from 'vitest';

vi.mock('@/api/endpoints/tasks.api', () => ({
  getTasks: vi.fn().mockResolvedValue([{ id: '1', title: 'Buy milk', done: false }]),
}));

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

it('returns tasks on success', async () => {
  const { result } = renderHook(() => useTasks(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(1);
});
```

### Integration Test — Component (Testing Library)
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from '@/features/tasks/components/TaskList';

it('calls onToggle when task is clicked', () => {
  const onToggle = vi.fn();
  const tasks = [{ id: '1', title: 'Buy milk', done: false }];

  render(<TaskList tasks={tasks} onToggle={onToggle} />);
  fireEvent.click(screen.getByText('Buy milk'));

  expect(onToggle).toHaveBeenCalledWith('1');
});
```

---

## E2E Testing (Playwright) — Full Stack

E2E tests exercise the real frontend + real backend together.

```ts
// tests/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test('user can register, log in, and see dashboard', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
```

---

## Test Commands

```bash
# Backend
npm run test              # all backend tests
npm run test:unit         # unit only
npm run test:integration  # integration only (requires test DB)
npm run test:coverage     # coverage report

# Frontend
npm run test              # all frontend tests (Vitest)
npm run test:watch        # watch mode
npx playwright test       # E2E tests
npx playwright test --ui  # Playwright UI mode

# Monorepo (Turborepo)
turbo test                # run all tests in all packages
```

---

## Naming Conventions

- Test files: `[name].test.ts(x)` or `[name].spec.ts` (E2E)
- `describe` blocks: match the module/component/hook being tested
- `it` / `test` blocks: `should [expected behavior] when [condition]`
