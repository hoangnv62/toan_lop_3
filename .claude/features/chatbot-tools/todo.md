# TODO: 5 Tool mới cho Chatbot Giáo viên

## Phase 1: Simple tools

- [x] Task 1: Tool `delete_exam`
  - [x] Tạo `backend/src/chat/tools/delete-exam/definition.js`
  - [x] Tạo `backend/src/chat/tools/delete-exam/handler.js`
  - [x] Cập nhật `registry.js` (TEACHER_TOOLS + TOOL_LABELS + toolRegistry)

- [x] Task 2: Tool `unassign_exam`
  - [x] Tạo `backend/src/chat/tools/unassign-exam/definition.js`
  - [x] Tạo `backend/src/chat/tools/unassign-exam/handler.js`
  - [x] Cập nhật `registry.js`

- [x] Task 3: Tool `create_announcement`
  - [x] Tạo `backend/src/chat/tools/create-announcement/definition.js`
  - [x] Tạo `backend/src/chat/tools/create-announcement/handler.js`
  - [x] Cập nhật `registry.js`

## Checkpoint A: Simple tools complete ✅

## Phase 2: Query & complex tools

- [x] Task 4: Tool `get_student_progress`
  - [x] Tạo `backend/src/chat/tools/get-student-progress/definition.js`
  - [x] Tạo `backend/src/chat/tools/get-student-progress/handler.js`
  - [x] Cập nhật `registry.js`

- [x] Task 5: Tool `update_exam`
  - [x] Tạo `backend/src/chat/tools/update-exam/definition.js`
  - [x] Tạo `backend/src/chat/tools/update-exam/handler.js`
  - [x] Cập nhật `registry.js`

## Checkpoint B: All tools complete ✅
- [x] 5 tool đăng ký đủ trong registry.js (tổng 13 tools)
- [x] 5 TOOL_LABELS tiếng Việt

## Phase 3: System prompt

- [x] Task 6: Cập nhật `backend/src/prompts/teacher-system.md`
  - [x] Thêm 6 dòng vào bảng "Khi nào dùng Tool"
  - [x] Thêm hướng dẫn xác nhận trước khi xóa đề
