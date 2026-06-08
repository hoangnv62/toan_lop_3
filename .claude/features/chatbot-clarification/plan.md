# Plan: Chatbot Clarification — Thu thập thông tin trước khi thực hiện tác vụ

## Context

Spec: `.claude/features/chatbot-clarification/SPEC.md`

Hiện tại chatbot giáo viên có 7 tools nhưng không có hướng dẫn thu thập thông tin từng bước, dễ dẫn đến việc tự bịa ID hoặc gọi tool thiếu tham số. Ngoài ra thiếu tool `assign_exam_to_class` dù API backend đã tồn tại (`POST /api/classes/:id/exams`, service `classService.assignExam` cũng có sẵn).

---

## Slice 1 — Cải thiện system prompt

**Objective**: Hướng dẫn LLM thu thập thông tin còn thiếu trước khi gọi tool, hỏi từng câu một.

**Files**:
- `backend/src/prompts/teacher-system.md` — thêm section mới vào cuối

**Thay đổi**: Thêm section `# Thu thập thông tin trước khi dùng tool` với 5 quy tắc:
1. Thiếu tham số bắt buộc → hỏi từng câu, không hỏi nhiều cùng lúc
2. Cần ID mà chưa biết → dùng get_lessons/get_classes trước
3. Thiếu tham số tuỳ chọn → hỏi, gợi ý giá trị mặc định trong ngoặc
4. Người dùng bỏ qua → dùng mặc định, xác nhận trước khi gọi tool
5. Không tự bịa ID

Thêm vào bảng "Khi nào dùng Tool": `assign_exam_to_class` → giao đề thi cho lớp

**Acceptance criteria**:
- [ ] Chatbot hỏi "Tên đề thi là gì?" khi thiếu `name` trước khi tạo đề
- [ ] Chatbot dùng `get_lessons` trước khi hỏi chọn bài học
- [ ] Chatbot dùng `get_classes` trước khi hỏi chọn lớp
- [ ] Khi nói "bỏ qua deadline", chatbot xác nhận không đặt deadline rồi tiếp tục
- [ ] Không hỏi lại thông tin đã cung cấp

---

## Slice 2 — Tool mới: `assign_exam_to_class`

**Objective**: Cho phép chatbot giao đề thi cho lớp qua hội thoại tự nhiên.

**Files**:
- `backend/src/chat/tools/assign-exam/definition.js` — **mới**
- `backend/src/chat/tools/assign-exam/handler.js` — **mới**
- `backend/src/chat/tools/registry.js` — thêm import + đăng ký

**Definition**: OpenAI tool schema với params: exam_id (required), class_id (required), time_limit (default 1200), open_time (nullable), deadline (nullable).

**Handler**: Gọi `classService.assignExam(classId, user.id, examId, deadline, openTime, timeLimit)`. Trả về thông báo xác nhận giao bài thành công (tên đề + tên lớp + deadline nếu có).

**Phụ thuộc**: Không. `classService.assignExam` đã tồn tại ở `backend/src/services/class.service.js`.

**Acceptance criteria**:
- [ ] `POST /api/classes/:classId/exams` được gọi đúng params
- [ ] Label "Đang giao bài tập cho lớp..." hiển thị khi tool chạy
- [ ] Chatbot xác nhận kết quả sau khi giao thành công
- [ ] Nếu đề đã giao rồi → lỗi rõ ràng từ backend được truyền lại

---

## Thứ tự thực hiện

1. **Slice 1 — Prompt** (không phụ thuộc): Sửa `teacher-system.md`, test bằng cách chat thử
2. **Slice 2 — Tool** (độc lập): Tạo tool files, update registry

Cả 2 slice có thể làm song song; Slice 1 không ảnh hưởng Slice 2.
