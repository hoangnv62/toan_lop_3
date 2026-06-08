# Plan: Chat History Persistence

## Context

Feature spec: `.claude/features/chat-history/SPEC.md`

**Goal:** Lưu lịch sử chat vào DB, chatbot nhớ ngữ cảnh 24h kể từ tin nhắn đầu tiên. Lịch sử giữ sau logout/login. Không cần nút xóa.

---

## Codebase Findings

| File | Hiện trạng |
|------|------------|
| `backend/src/controllers/chat.controller.js` | Nhận `req.body.messages`, gọi `runChat`, stream SSE. Hoàn toàn stateless. |
| `backend/src/services/chat.service.js` | Delegate đơn giản đến teacher/student agent. |
| `backend/src/routes/chat.route.js` | Chỉ có `POST /` với validate + asyncHandler. |
| `backend/src/validation/schema/chat.schema.js` | `messages: array({role, content}).min(1)` |
| `backend/src/config/database.js` | Helpers: `query`, `queryOne`, `insert`, `transaction`. Named placeholders (`:name`). |
| `frontend/src/api/chatService.js` | Chỉ có `streamChat()`, gửi `messages[]` full history. |
| `frontend/src/components/shared/ChatBot.jsx` | State chỉ trong React, `handleSend` gửi `history.slice(1)` — toàn bộ lịch sử. |

**Quan trọng:** Database helpers dùng named placeholders (`:name`), không phải `?`. Pattern repository dùng `query()`, `queryOne()`, `insert()` từ `database.js` — không cần manually manage connections.

---

## Architecture Decision

Backend sẽ là **canonical source of truth** cho lịch sử chat:

```
[Cũ] Frontend gửi full history → Agent dùng trực tiếp
[Mới] Frontend gửi 1 tin nhắn → Backend load DB history → Agent nhận DB history → Backend lưu response
```

- Frontend chỉ gửi `[{ role: 'user', content: '...' }]`
- Backend: `getOrCreateSession` → `saveUserMessage` → `loadHistory` → `runAgent` → `saveAssistantResponse`
- Tool messages (intermediate) KHÔNG được lưu — chỉ final user + assistant

---

## Slice 1 — DB Schema + Repository

**Objective:** Tạo foundation layer. Không thay đổi hành vi hiện tại.

### Files

**`backend/database/create_db.js`** — Thêm sau các CREATE TABLE hiện tại:
```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  role       ENUM('user', 'assistant') NOT NULL,
  content    TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
```

**`backend/src/repositories/chat.repository.js`** — File mới:
```js
import { query, queryOne, insert } from '../config/database.js';

// Lấy session còn hạn của user, tạo mới nếu không có
export const getOrCreateSession = async (userId) => {
  const existing = await queryOne(
    'SELECT id, expires_at FROM chat_sessions WHERE user_id = :userId AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    { userId }
  );
  if (existing) return existing;
  const id = await insert(
    'INSERT INTO chat_sessions (user_id, expires_at) VALUES (:userId, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
    { userId }
  );
  return { id };
};

// Lưu 1 tin nhắn vào session
export const saveMessage = (sessionId, role, content) =>
  insert(
    'INSERT INTO chat_messages (session_id, role, content) VALUES (:sessionId, :role, :content)',
    { sessionId, role, content }
  );

// Lấy tất cả messages của session theo thứ tự thời gian
export const getSessionMessages = (sessionId) =>
  query(
    'SELECT role, content, created_at FROM chat_messages WHERE session_id = :sessionId ORDER BY created_at ASC',
    { sessionId }
  );

// Lấy active session của user (dùng cho GET /api/chat/history)
export const getActiveSession = (userId) =>
  queryOne(
    'SELECT id, expires_at FROM chat_sessions WHERE user_id = :userId AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    { userId }
  );
```

### Acceptance Criteria
- [ ] Chạy `create_db.js` → tạo được 2 bảng mới
- [ ] `getOrCreateSession` trả về session cũ nếu còn hạn, tạo mới nếu hết hạn
- [ ] `saveMessage` insert đúng session_id, role, content
- [ ] `getSessionMessages` trả về đúng thứ tự ASC

---

## Checkpoint: Foundation Complete

- [ ] Bảng `chat_sessions` và `chat_messages` tồn tại trong DB

---

## Slice 2 — Backend Saves & Loads History

**Objective:** Backend dùng DB history thay vì messages từ request. Chatbot nhớ ngữ cảnh kể cả sau reload (dữ liệu đã có trong DB).

### Files

**`backend/src/services/chat.service.js`** — Sửa:
```js
import { runTeacherAgent } from '../chat/agent/teacher-agent.js';
import { runStudentAgent } from '../chat/agent/student-agent.js';
import { Authority } from '../constants/authority.js';
import * as chatRepo from '../repositories/chat.repository.js';

export const runChat = async (newUserContent, role, user, callbacks) => {
  const { id: sessionId } = await chatRepo.getOrCreateSession(user.id);
  await chatRepo.saveMessage(sessionId, 'user', newUserContent);

  const dbMessages = await chatRepo.getSessionMessages(sessionId);
  const history = dbMessages.map(m => ({ role: m.role, content: m.content }));

  let fullResponse = '';
  const wrappedCallbacks = {
    ...callbacks,
    onToken: (token) => {
      fullResponse += token;
      callbacks.onToken?.(token);
    },
  };

  if (role === Authority.TEACHER) {
    await runTeacherAgent(history, user, wrappedCallbacks);
  } else {
    await runStudentAgent(history, wrappedCallbacks);
  }

  await chatRepo.saveMessage(sessionId, 'assistant', fullResponse);
};
```

**`backend/src/controllers/chat.controller.js`** — Sửa: extract tin nhắn user cuối cùng, không truyền full messages array:
```js
import { runChat } from '../services/chat.service.js';

export const chat = async (req, res) => {
  const { messages } = req.body;
  const role = req.user.role;
  const newUserContent = messages[messages.length - 1].content; // lấy tin nhắn user mới nhất

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    await runChat(newUserContent, role, req.user, {
      onToken: (token) => res.write(`data: ${JSON.stringify({ token })}\n\n`),
      onToolStart: (data) => res.write(`event: tool_start\ndata: ${JSON.stringify(data)}\n\n`),
      onToolDone: (data) => res.write(`event: tool_done\ndata: ${JSON.stringify(data)}\n\n`),
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.write(`data: ${JSON.stringify({ token: 'Xin lỗi, tôi gặp lỗi rồi. Vui lòng thử lại!' })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
};
```

**Note:** Validation schema `chatSchema` không cần sửa — vẫn là `array.min(1)`, tương thích với cả `[1 message]` lẫn `[nhiều messages]`.

### Acceptance Criteria
- [ ] Gửi tin nhắn → DB có row mới trong `chat_messages` (cả user lẫn assistant)
- [ ] Gửi tin nhắn thứ 2 → agent nhận đủ ngữ cảnh (cả 2 lượt đầu)
- [ ] Reload trang → gửi tin nhắn mới → chatbot vẫn nhớ ngữ cảnh (DB có history)
- [ ] Teacher agent tool calling vẫn hoạt động bình thường
- [ ] Session mới tạo khi không có active session

---

## Checkpoint: Core Complete

- [ ] Chat messages được lưu vào DB sau mỗi lượt
- [ ] Chatbot nhớ ngữ cảnh trong cùng session
- [ ] Tool calling không bị break

---

## Slice 3 — GET /api/chat/history + Frontend Loads on Mount

**Objective:** Frontend hiển thị lại lịch sử sau khi reload. Frontend gửi 1 message thay vì full history.

### Files

**`backend/src/controllers/chat.controller.js`** — Thêm `getChatHistory`:
```js
import * as chatRepo from '../repositories/chat.repository.js';

export const getChatHistory = async (req, res) => {
  const session = await chatRepo.getActiveSession(req.user.id);
  if (!session) {
    return res.json({ success: true, data: { messages: [], expiresAt: null } });
  }
  const rows = await chatRepo.getSessionMessages(session.id);
  const messages = rows.map(r => ({
    role: r.role,
    content: r.content,
    createdAt: r.created_at,
  }));
  res.json({ success: true, data: { messages, expiresAt: session.expires_at } });
};
```

**`backend/src/routes/chat.route.js`** — Thêm GET route:
```js
import { chat, getChatHistory } from '../controllers/chat.controller.js';
// ...
router.get('/history', asyncHandler(getChatHistory));
router.post('/', validateChat, asyncHandler(chat));
```

**`frontend/src/api/chatService.js`** — Thêm `getChatHistory`:
```js
import api from './index';

export const getChatHistory = () => api.get('/api/chat/history');
// ... streamChat hiện tại giữ nguyên
```

**`frontend/src/components/shared/ChatBot.jsx`** — 2 thay đổi:

1. **Load history on mount:**
```js
import { streamChat, getChatHistory } from '../../api/chatService';

useEffect(() => {
  getChatHistory().then(data => {
    if (data.messages?.length > 0) {
      setMessages([{ role: 'assistant', content: welcome }, ...data.messages]);
    }
  }).catch(() => {}); // silent fail nếu API lỗi
}, []); // chỉ chạy 1 lần khi mount
```

2. **Gửi 1 message thay vì full history trong `handleSend`:**
```js
// Thay dòng: await streamChat(history.slice(1), ...)
await streamChat([userMsg], ...callbacks);
```

### Acceptance Criteria
- [ ] `GET /api/chat/history` trả về messages đúng định dạng
- [ ] Reload trang → chatbot hiển thị lịch sử cũ (nếu session còn hạn)
- [ ] Không có session active → chatbot chỉ hiển thị welcome message
- [ ] `handleSend` gửi `[{ role: 'user', content }]` thay vì full array
- [ ] `expiresAt` có trong response (dùng sau nếu cần)

---

## Checkpoint: Done

- [ ] Tin nhắn lưu vào DB sau mỗi lượt chat
- [ ] Chatbot nhớ ngữ cảnh trong session 24h
- [ ] Reload trang không mất lịch sử chat
- [ ] Sau 24h session hết hạn → cuộc trò chuyện mới
- [ ] Đăng xuất + đăng nhập lại → vẫn thấy lịch sử (nếu chưa hết 24h)
- [ ] Teacher tool calling không bị ảnh hưởng

---

## Edge Cases & Handling

| Case | Handling |
|------|----------|
| `getChatHistory` lỗi khi mount | `catch(() => {})` — silent fail, hiển thị welcome như cũ |
| `fullResponse` rỗng (agent lỗi giữa chừng) | Vẫn lưu vào DB nhưng content = `''` — chấp nhận được |
| Session hết hạn giữa 1 request | `getOrCreateSession` tạo session mới → message bắt đầu fresh |
| Tool messages (role='tool') | Không được lưu — service chỉ lưu sau khi agent hoàn tất với `fullResponse` |
| Concurrent requests cùng user | Đều gọi `getOrCreateSession` → SELECT trước, nếu không có thì INSERT → race condition hiếm, chấp nhận được cho scale nhỏ |
