# Quy chuẩn viết REST API

## Layering bắt buộc

```
Route → Controller → Service → Repository → Database
```

- **Route**: URL rules + middleware chain. Không có logic.
- **Controller**: Parse `req`, gọi service, format `res`. Không có SQL, không có business logic.
- **Service**: Business logic, validation nghiệp vụ, throw AppError. Không có HTTP concept.
- **Repository**: Raw SQL queries. Không có business logic.

---

## Route

```javascript
// src/routes/question-bank.route.js
import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { isTeacher } from '../middleware/authorize.middleware.js';
import * as ctrl from '../controllers/question-bank.controller.js';
import { validateQuestionBank } from '../validation/question-bank.validation.js';

const router = Router();
router.use(authenticate, isTeacher);   // protect toàn bộ route group

router.get('/',     asyncHandler(ctrl.list));
router.post('/',    validateQuestionBank, asyncHandler(ctrl.create));
router.put('/:id',  validateQuestionBank, asyncHandler(ctrl.update));
router.delete('/:id', asyncHandler(ctrl.remove));

export default router;
```

**Quy tắc:**
- Import controller dưới dạng namespace: `import * as ctrl`
- Mọi async handler phải wrap bằng `asyncHandler()`
- Validation middleware đặt trước controller: `validateXxx, asyncHandler(ctrl.handler)`
- Auth middleware: `authenticate` (JWT check) + `isTeacher`/`isStudent` (role check)

---

## Controller

```javascript
// src/controllers/question-bank.controller.js
import * as svc from '../services/question-bank.service.js';

export const list = async (req, res) => {
  const { q = '', page = 1, limit = 10, lessonId } = req.query;
  const data = await svc.list(req.user.user_id, q, parseInt(page), parseInt(limit), lessonId);
  res.json({ success: true, data });
};

export const create = async (req, res) => {
  const id = await svc.create(req.user.user_id, req.body);
  res.status(201).json({ success: true, id });
};

export const update = async (req, res) => {
  await svc.update(parseInt(req.params.id), req.user.user_id, req.body);
  res.json({ success: true, message: 'Đã cập nhật' });
};

export const remove = async (req, res) => {
  await svc.remove(parseInt(req.params.id), req.user.user_id);
  res.json({ success: true, message: 'Đã xóa' });
};
```

**Quy tắc:**
- Import service dưới dạng namespace: `import * as svc`
- Không có business logic, không có SQL
- Parse type từ query/params: `parseInt(req.params.id)`, `parseInt(page)`
- `req.user` có shape: `{ user_id, role, name }` — do `authenticate` middleware populate
- Role check bằng middleware (`isTeacher`), tránh check thủ công trong controller
- Input trimming trước khi truyền service: `username.trim()`

---

## Response Format

```javascript
// Thành công với data
res.json({ success: true, data: { ... } });

// Thành công với message
res.json({ success: true, message: 'Đã cập nhật' });

// Tạo mới (201)
res.status(201).json({ success: true, id });

// Lỗi — do errorHandler middleware xử lý tự động
// { success: false, message: "..." }
```

**camelCaseResponse middleware** tự động convert snake_case → camelCase trong toàn bộ JSON response.
Không cần convert thủ công trong controller.

---

## Error Handling

```javascript
// Throw trong service — errorHandler middleware sẽ bắt
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/error.utils.js';

throw new NotFoundError('Câu hỏi không tồn tại');
throw new ConflictError('Tên đã tồn tại');
throw new ForbiddenError('Không có quyền');
```

| Class | HTTP Status |
|-------|------------|
| `BadRequestError` | 400 |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `AppError` | 400 (default) |

Lỗi không phải AppError → 500, log ra console.

---

## Validation

```javascript
// src/validation/schema/question-bank.schema.js
import { z } from 'zod';

const answerSchema = z.object({
  content:   z.string().min(1, 'Nội dung đáp án không được trống'),
  isCorrect: z.boolean(),
});

export const questionBankSchema = z.object({
  content:     z.string().min(1, 'Nội dung câu hỏi không được trống'),
  explanation: z.string().nullable().optional(),
  lessonId:    z.coerce.number().int().positive().nullable().optional(),
  answers:     z.array(answerSchema).default([]),
});

// src/validation/question-bank.validation.js
import { validate } from './validate-handler.js';
import { questionBankSchema } from './schema/question-bank.schema.js';

export const validateQuestionBank = validate({ body: questionBankSchema });
```

**Quy tắc:**
- Error message bằng tiếng Việt
- Dùng `z.coerce.number()` cho params/query đến dưới dạng string
- Schema file tách riêng (`schema/`) khỏi validation middleware file

---

## File Upload

```javascript
// Route
router.post('/import-excel', upload.single('file'), asyncHandler(ctrl.importExcel));

// Controller
export const importExcel = async (req, res) => {
  if (!req.file) throw new BadRequestError('Vui lòng chọn file');
  const questions = await svc.parseExcel(req.file.buffer);
  res.json({ success: true, data: questions });
};
```

- Dùng `multer` memory storage — không ghi file ra disk
- Buffer tại `req.file.buffer`
- Chỉ chấp nhận `.xlsx` / `.xls`

---

## File Download (Excel/PDF)

```javascript
export const exportResults = async (req, res) => {
  if (req.user.role !== 'teacher') throw new ForbiddenError();
  const { examName, buffer } = await svc.exportResults(parseInt(req.params.id));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(examName)}.xlsx"`);
  res.send(buffer);
};
```

---

## Streaming (SSE)

```javascript
export const chat = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Text token
  res.write(`data: ${JSON.stringify({ token })}\n\n`);

  // Tool events (teacher only)
  res.write(`event: tool_start\ndata: ${JSON.stringify({ tool, label })}\n\n`);
  res.write(`event: tool_done\ndata: ${JSON.stringify({ tool })}\n\n`);

  // Kết thúc
  res.write('data: [DONE]\n\n');
  res.end();
};
```

---

## URL Naming

- Collections: số nhiều — `/api/lessons`, `/api/classes`
- Resource: `/api/lessons/:id`
- Sub-resource: `/api/classes/:id/students`
- Actions (non-CRUD): `/api/exams/:id/clone`, `/api/exams/:id/submit`
- Tất cả lowercase, kebab-case: `/api/question-bank`
