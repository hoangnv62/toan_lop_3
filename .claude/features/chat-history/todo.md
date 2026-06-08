# TODO: Chat History Persistence

## Phase 1: Foundation (DB + Repository)

- [x] **1.1** Thêm `chat_sessions` và `chat_messages` vào `backend/database/create_db.js`
- [x] **1.2** Tạo `backend/src/repositories/chat.repository.js` với 4 functions: `getOrCreateSession`, `saveMessage`, `getSessionMessages`, `getActiveSession`
- [ ] **1.3** Chạy `node database/create_db.js` để tạo bảng, xác nhận 2 bảng mới tồn tại *(cần MariaDB đang chạy)*

## Checkpoint: Foundation Complete
- [ ] Bảng `chat_sessions` và `chat_messages` tồn tại trong DB

---

## Phase 2: Backend Saves & Loads History

- [x] **2.1** Sửa `backend/src/services/chat.service.js`: `runChat` nhận `newUserContent` (string) thay vì `messages[]`, load history từ DB, lưu user + assistant messages
- [x] **2.2** Sửa `backend/src/controllers/chat.controller.js`: extract `messages[messages.length - 1].content` truyền vào service
- [ ] **2.3** Kiểm tra thủ công: gửi 2 lượt chat → xem DB có rows → gửi lượt 3 → chatbot nhớ ngữ cảnh lượt 1 và 2

## Checkpoint: Core Complete
- [ ] DB có rows trong `chat_messages` sau mỗi lượt chat
- [ ] Chatbot nhớ ngữ cảnh giữa các lượt trong cùng session
- [ ] Teacher agent tool calling vẫn hoạt động

---

## Phase 3: Frontend Loads History

- [x] **3.1** Thêm `getChatHistory` vào `backend/src/controllers/chat.controller.js`
- [x] **3.2** Thêm `GET /history` route vào `backend/src/routes/chat.route.js`
- [x] **3.3** Thêm `getChatHistory()` vào `frontend/src/api/chatService.js`
- [x] **3.4** Sửa `frontend/src/components/shared/ChatBot.jsx`:
  - Load history on mount với `useEffect`
  - Đổi `handleSend` gửi `[userMsg]` thay vì `history.slice(1)`
- [ ] **3.5** Kiểm tra thủ công: chat → reload trang → mở chatbot → thấy lại lịch sử cũ

## Checkpoint: Done
- [ ] Reload trang không mất lịch sử chat
- [ ] Session hết hạn (test bằng cách set expires_at nhỏ) → chat mới bắt đầu
- [ ] Đăng xuất + đăng nhập → lịch sử vẫn còn (nếu trong 24h)
