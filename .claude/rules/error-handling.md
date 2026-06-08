# Error Handling — Fullstack

> Covers both **backend** (AppError, Express handler) and **frontend** (Error Boundaries, error states).  
> The two layers must agree on error response shape so the frontend can display meaningful messages.

---

## Agreed Error Contract (Backend → Frontend)

```json
// All API errors follow this envelope
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",      // machine-readable, for frontend logic
    "message": "User not found",   // human-readable, can show to user
    "details": []                  // optional field-level errors (validation)
  }
}
```

---

## Backend Error Handling

### Custom Error Class
```ts
class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Throwing Errors
```ts
if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
if (!hasPermission) throw new AppError('Forbidden', 403, 'ACCESS_DENIED');
```

### Global Error Handler (Express)
```ts
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  logger.error({ err, method: req.method, url: req.url });

  if (!err.isOperational) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }

  res.status(status).json({
    success: false,
    error: { code: err.code, message: err.message }
  });
}
```

### Async Route Wrapper
```ts
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

---

## Frontend Error Handling

### Error Boundary (React)
```tsx
'use client';

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error: Error, info) {
    // Send to Sentry / error tracker
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert">
          <p>Something went wrong.</p>
          <button onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Next.js Built-in Error Files
```
app/error.tsx        ← Route-level error boundary ('use client')
app/not-found.tsx    ← 404 page
```

### Reading API Errors (TanStack Query)
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['user', id],
  queryFn: () => api.users.getById(id),
});

if (error) {
  // error.response.data follows the agreed contract above
  const code = error.response?.data?.error?.code;
  if (code === 'USER_NOT_FOUND') return <NotFoundState />;
  return <ErrorState message={error.response?.data?.error?.message} onRetry={refetch} />;
}
```

### Global 401 Handler (Axios Interceptor)
```ts
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      authStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Reusable Error State Component
```tsx
export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-muted-foreground">{message}</p>
      {onRetry && <button onClick={onRetry}>Try again</button>}
    </div>
  );
}
```

---

## Rules Summary

| Situation | Layer | Pattern |
|-----------|-------|---------|
| Business rule violation | Backend | `throw new AppError(msg, 4xx, CODE)` |
| Unhandled server error | Backend | Global error handler → 500 |
| Component render crash | Frontend | `<ErrorBoundary>` |
| Route-level crash | Frontend | `app/error.tsx` |
| API fetch failure | Frontend | TanStack Query error state |
| Unauthorized (401) | Frontend | Axios interceptor → redirect login |
| Form validation | Both | Zod on backend + react-hook-form on frontend |

---

## Red Flags

- Catching errors with empty `catch {}` blocks
- Exposing stack traces or internal error messages to the client
- Not providing a retry or recovery action in the UI
- Frontend displaying raw API error strings without mapping
- Backend not logging errors before sending the response
