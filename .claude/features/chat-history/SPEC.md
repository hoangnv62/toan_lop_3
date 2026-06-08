# Feature: Chat History Persistence

## Objective

Lưu lịch sử cuộc trò chuyện của chatbot vào database để chatbot có thể ghi nhớ ngữ cảnh trong vòng 24 giờ kể từ tin nhắn đầu tiên. Sau khi session hết hạn, cuộc trò chuyện mới bắt đầu từ đầu.

## Target Users

- **Giáo viên (teacher):** Dùng chatbot với tool calling (7 AI tools). Cần nhớ ngữ cảnh để tiếp tục các tác vụ dở dang (tạo đề thi, xem thống kê...).
- **Học sinh (student):** Dùng chatbot hỏi bài đơn giản. Cần nhớ ngữ cảnh để không phải nhắc lại bối cảnh mỗi lần.

## Core Features

### 1. Lưu tin nhắn vào database
- Mỗi lượt chat (user message + assistant response) được lưu vào DB ngay sau khi hoàn thành
- Acceptance criteria:
  - [ ] Tin nhắn của user được lưu trước khi gọi LLM
  - [ ] Phản hồi của assistant được lưu sau khi stream hoàn tất
  - [ ] Cả hai role (teacher, student) đều được lưu

### 2. Session 24h gắn với user
- Mỗi user có tối đa 1 active session tại một thời điểm
- Session có thời hạn 24h kể từ lúc tạo (`created_at + 24h`)
- Khi session hết hạn → tạo session mới tự động
- Lịch sử giữ nguyên sau khi đăng xuất và đăng nhập lại (vì gắn `user_id`)
- Acceptance criteria:
  - [ ] Session mới được tạo khi user chat lần đầu hoặc sau khi session cũ hết hạn
  - [ ] Đăng xuất rồi đăng nhập lại → vẫn thấy lịch sử cũ (nếu chưa hết 24h)
  - [ ] Sau 24h → session hết hạn → cuộc trò chuyện mới bắt đầu

### 3. Chatbot dùng DB history làm ngữ cảnh
- Backend load lịch sử từ DB và truyền cho LLM thay vì dùng messages từ request
- Frontend chỉ cần gửi tin nhắn mới nhất (không cần gửi toàn bộ lịch sử)
- Acceptance criteria:
  - [ ] Reload trang → gửi tin nhắn mới → chatbot vẫn nhớ ngữ cảnh trước đó
  - [ ] LLM nhận đúng lịch sử các messages từ DB theo thứ tự `created_at ASC`
  - [ ] Teacher agent tool calling vẫn hoạt động bình thường

### 4. Hiển thị lịch sử khi mở lại chatbot
- Khi mở chatbot (hoặc reload trang), frontend load và hiển thị lịch sử từ API
- Acceptance criteria:
  - [ ] `GET /api/chat/history` trả về messages của active session
  - [ ] Messages hiển thị đúng thứ tự (cũ → mới) trong UI
  - [ ] Nếu không có active session → chatbot hiển thị welcome message như hiện tại

## Out of Scope

- Nút "Xóa lịch sử" (tự động hết hạn sau 24h là đủ)
- Nhiều session song song cho một user
- Export lịch sử chat
- Tìm kiếm trong lịch sử
- Cron job dọn dẹp records hết hạn (rows cũ vẫn ở DB nhưng không được dùng)
- Lưu intermediate tool messages (chỉ lưu user message và final assistant response)

## Technical Approach

### Data Models

```sql
CREATE TABLE chat_sessions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chat_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  session_id  INT NOT NULL,
  role        ENUM('user', 'assistant') NOT NULL,
  content     TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
```

### API Contracts

**POST /api/chat** (sửa đổi — nhận 1 message thay vì full history)
```json
Request:  { "messages": [{ "role": "user", "content": "..." }] }
Response: SSE stream (không đổi)
```

**GET /api/chat/history** (mới)
```json
Response: {
  "success": true,
  "data": {
    "messages": [
      { "role": "user", "content": "...", "createdAt": "..." },
      { "role": "assistant", "content": "...", "createdAt": "..." }
    ],
    "expiresAt": "2026-06-09T10:00:00Z"
  }
}
```
Nếu không có active session: `data.messages = []`, `data.expiresAt = null`

### Integration Points

| File | Thay đổi |
|------|----------|
| `backend/database/create_db.js` | Thêm 2 bảng mới |
| `backend/src/repositories/chat.repository.js` | Mới — CRUD sessions & messages |
| `backend/src/services/chat.service.js` | Load/save history từ DB |
| `backend/src/controllers/chat.controller.js` | Thêm `getChatHistory`, sửa `chat` |
| `backend/src/routes/chat.route.js` | Thêm `GET /api/chat/history` |
| `frontend/src/api/chatService.js` | Mới — gọi `GET /api/chat/history` |
| `frontend/src/components/shared/ChatBot.jsx` | Load history on mount, gửi 1 message |

### Session Logic (Backend)

```
POST /api/chat nhận được:
1. Lấy user message cuối từ request
2. getOrCreateSession(user.id):
   → SELECT session WHERE user_id=? AND expires_at > NOW()
   → Nếu không có: INSERT session với expires_at = NOW() + INTERVAL 24 HOUR
3. saveMessage(sessionId, 'user', content)
4. getSessionMessages(sessionId) → history []
5. Gọi agent với history từ DB (không dùng messages từ request)
6. Sau khi stream xong: saveMessage(sessionId, 'assistant', fullResponse)
```

## Code Style

- Tuân theo rules trong `.claude/rules/`
- Repository: raw SQL với parameterized queries (`?`), release connection trong `finally`
- Không lưu tool messages (chỉ role `user` và `assistant`)

## Testing Strategy

- Manual verification: reload trang → chat → kiểm tra ngữ cảnh còn nhớ
- Manual verification: kiểm tra DB có rows đúng sau mỗi lượt chat
- Manual verification: teacher agent tool calling vẫn hoạt động

## Boundaries

### Always Do
- Chỉ lưu role `user` và `assistant` vào `chat_messages` (không lưu `tool`)
- Luôn release DB connection trong `finally`
- Dùng parameterized queries

### Ask First
- Nếu conversation history quá dài (> N messages) gây chậm LLM → có cần cắt bớt không?

### Never Do
- Không log content của messages (có thể chứa thông tin nhạy cảm)
- Không để history từ frontend override history từ DB
