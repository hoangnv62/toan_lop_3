# Quy chuẩn viết Tool (Chat Tool Calling)

## Nguyên tắc bất biến

1. **Tool Handler không chứa SQL** — phải gọi Domain Service
2. **Tool Executor không chứa business logic** — chỉ lookup registry, validate, dispatch
3. **Domain Service dùng chung** giữa REST API, Chat Tool và MCP (tương lai)
4. **Mọi tool phải trả về cùng format**
5. **Chỉ teacher mới thấy tools** — không pass tools vào request khi `role === 'student'`

---

## Cấu trúc thư mục

```
src/chat/tools/
  registry.js                   ← Map tên tool → handler
  executor.js                   ← Lookup, validate, execute, log
  search-question/
    definition.js               ← JSON Schema (OpenAI tool format)
    handler.js                  ← Validate Zod + gọi Domain Service
  save-question/
    definition.js
    handler.js
  get-student-stats/
    definition.js
    handler.js
```

---

## Cấu trúc file `definition.js`

```javascript
export const definition = {
  type: 'function',
  function: {
    name: 'search_question_bank',
    description: 'Tìm câu hỏi trong ngân hàng câu hỏi theo chủ đề hoặc bài học.',
    parameters: {
      type: 'object',
      properties: {
        topic:     { type: 'string',  description: 'Từ khóa tìm kiếm' },
        lesson_id: { type: 'integer', description: 'ID bài học' },
        limit:     { type: 'integer', description: 'Số câu tối đa (default 10, max 20)' },
      },
      required: [],
    },
  },
};
```

---

## Cấu trúc file `handler.js`

```javascript
import { z } from 'zod';
import * as questionBankService from '../../modules/question-bank/question-bank.service.js';

const inputSchema = z.object({
  topic:     z.string().optional(),
  lesson_id: z.number().int().positive().optional(),
  limit:     z.number().int().min(1).max(20).default(10),
});

export const handler = async (args, user) => {
  const parsed = inputSchema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { topic, lesson_id, limit } = parsed.data;
  const result = await questionBankService.search(user.user_id, { topic, lessonId: lesson_id, limit });

  return {
    success: true,
    data: result,
    message: `Tìm thấy ${result.total} câu hỏi.`,
    metadata: { tool: 'search_question_bank', userId: user.user_id },
  };
};
```

---

## Tool Result Format (bắt buộc)

Mọi tool phải trả đúng format này:

```javascript
{
  success: true | false,
  data: {},         // kết quả chính
  message: "",      // mô tả ngắn gọn kết quả
  metadata: {}      // thông tin bổ sung (toolName, userId, duration...)
}
```

Không trả về format nào khác.

---

## Tool Registry

```javascript
// src/chat/tools/registry.js
import { handler as searchQuestionHandler } from './search-question/handler.js';
import { handler as saveQuestionHandler }   from './save-question/handler.js';
import { handler as getStudentStatsHandler } from './get-student-stats/handler.js';

export const toolRegistry = {
  search_question_bank:  searchQuestionHandler,
  save_questions_to_bank: saveQuestionHandler,
  get_student_stats:     getStudentStatsHandler,
};
```

**Không dùng switch/case** để dispatch tool.

---

## Tool Executor

```javascript
// src/chat/tools/executor.js
import { toolRegistry } from './registry.js';

export const executeTool = async (name, args, user) => {
  const handler = toolRegistry[name];
  if (!handler) {
    return { success: false, data: null, message: `Tool không tồn tại: ${name}`, metadata: {} };
  }
  const start = Date.now();
  try {
    const result = await handler(args, user);
    log({ userId: user.user_id, tool: name, duration: Date.now() - start, success: true });
    return result;
  } catch (err) {
    log({ userId: user.user_id, tool: name, duration: Date.now() - start, success: false, error: err.message });
    return { success: false, data: null, message: err.message, metadata: {} };
  }
};
```

---

## Validation trong Handler

Dùng Zod `.safeParse()`, không throw exception khi invalid:

```javascript
const parsed = inputSchema.safeParse(args);
if (!parsed.success) {
  return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
}
```

---

## Logging bắt buộc

Mỗi tool call phải log:

```javascript
{
  requestId: string,
  userId: number,
  toolName: string,
  duration: number,    // ms
  success: boolean,
  error?: string,
}
```

**Không log**: nội dung prompt, câu hỏi của user, dữ liệu nhạy cảm.

---

## Thêm tool mới

Quy trình thêm tool mới (không sửa executor hay chat service):

1. Kiểm tra Domain Service đã có method cần thiết chưa. Nếu chưa → thêm vào service
2. Tạo thư mục `src/chat/tools/<ten-tool>/`
3. Viết `definition.js` (JSON Schema)
4. Viết `handler.js` (Zod validate + gọi service)
5. Đăng ký vào `registry.js`
6. Thêm `definition` vào danh sách tools truyền vào LLM trong `teacher-agent.js`

---

## Tools hiện có

| Tool | Domain Service | Mô tả |
|------|---------------|-------|
| `search_question_bank` | QuestionBankService.search() | Tìm câu hỏi theo topic/lesson |
| `save_questions_to_bank` | QuestionBankService.saveBatch() | Lưu nhiều câu hỏi |
| `get_student_stats` | StudentService.getStatsByTeacher() | Thống kê học sinh theo lớp |
