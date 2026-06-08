# TODO: Chatbot Clarification

## Slice 1: System Prompt Improvement

- [x] 1.1: Thêm section "Thu thập thông tin trước khi dùng tool" vào `backend/src/prompts/teacher-system.md`
- [x] 1.2: Thêm `assign_exam_to_class` vào bảng "Khi nào dùng Tool" trong cùng file

## Checkpoint: Prompt Complete
- [ ] Chat thử: "Giao bài tập cho lớp" → chatbot hỏi đề thi nào (không tự bịa)
- [ ] Chat thử: "Tạo đề thi" → chatbot hỏi bài học trước

## Slice 2: Tool assign_exam_to_class

- [x] 2.1: Tạo `backend/src/chat/tools/assign-exam/definition.js`
- [x] 2.2: Tạo `backend/src/chat/tools/assign-exam/handler.js`
- [x] 2.3: Cập nhật `backend/src/chat/tools/registry.js` — import + TEACHER_TOOLS + TOOL_LABELS + toolRegistry

## Checkpoint: Tool Complete
- [ ] Chat: "Giao đề thi cho lớp 3A" → chatbot hỏi đề + lớp + thời gian → giao thành công
- [ ] Tool label "Đang giao bài tập cho lớp..." hiển thị đúng
