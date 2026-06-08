# Feature: Chatbot Clarification — Thu thập thông tin trước khi thực hiện tác vụ

## Objective

Chatbot giáo viên chủ động hỏi từng thông tin còn thiếu trước khi gọi tool, thay vì tự bịa hoặc bỏ qua. Khi người dùng bỏ qua một thông tin, chatbot dùng giá trị mặc định hợp lý.

## Target Users

**Giáo viên** — muốn ra lệnh cho chatbot bằng ngôn ngữ tự nhiên mà không cần nhớ đủ các trường bắt buộc.

---

## Vấn đề hiện tại

| Tool | Vấn đề |
|------|--------|
| `create_exam` | Nếu không nói lesson, chatbot tự chọn hoặc hỏi không rõ ràng |
| `save_questions_to_bank` | Không hỏi chủ đề/bài học để phân loại |
| `get_student_stats` | Nếu có nhiều lớp, không hỏi lớp nào |
| `get_exam_stats` | Không hỏi đề thi nào nếu chưa rõ |
| **`assign_exam_to_class`** | **Tool này chưa tồn tại** — không thể giao bài cho lớp qua chatbot |

---

## Core Features

### 1. System prompt: hướng dẫn thu thập thông tin từng bước

Thêm vào `teacher-system.md` một section rõ ràng hướng dẫn LLM:
- Trước khi gọi tool, kiểm tra các tham số **bắt buộc** đã đủ chưa
- Nếu thiếu: hỏi **từng câu một**, chờ người dùng trả lời rồi mới hỏi câu tiếp theo
- Nếu người dùng bỏ qua (nói "không cần", "thôi", "bỏ qua"): dùng giá trị mặc định và thông báo

**Acceptance criteria:**
- [ ] Chatbot nói "Tên đề thi là gì?" khi thiếu `name` trước khi tạo đề
- [ ] Chatbot dùng `get_lessons` rồi hỏi chọn bài học nếu thiếu `lesson_id`
- [ ] Chatbot dùng `get_classes` rồi hỏi chọn lớp nếu thiếu `class_id`
- [ ] Khi người dùng nói "bỏ qua deadline", chatbot xác nhận "Sẽ không đặt deadline" rồi tiếp tục
- [ ] Không hỏi lại thông tin đã được cung cấp trong câu trước đó

### 2. Tool mới: `assign_exam_to_class`

Thêm tool cho phép chatbot giao đề thi đã có cho một lớp học, với đầy đủ thông tin cần thiết.

**Tham số:**
| Param | Bắt buộc | Mặc định | Mô tả |
|-------|----------|----------|-------|
| `exam_id` | Có | — | ID đề thi cần giao |
| `class_id` | Có | — | ID lớp nhận bài |
| `time_limit` | Không | 1200 (20 phút) | Thời gian làm bài (giây) |
| `open_time` | Không | null (ngay lập tức) | Thời điểm mở đề (ISO string) |
| `deadline` | Không | null (không giới hạn) | Thời hạn nộp bài (ISO string) |

**Luồng hội thoại mẫu:**
```
User: "Giao bài tập về phép cộng cho lớp 3A"
Bot:  "Thầy/cô muốn giao đề thi nào? (tôi đang lấy danh sách...)"
      → gọi get_lessons + tìm đề thi liên quan
Bot:  "Tôi thấy các đề sau: [1] Kiểm tra phép cộng, [2] Ôn tập phép cộng. Thầy/cô chọn đề nào?"
User: "Đề 1"
Bot:  "Thời gian làm bài là bao lâu? (mặc định 20 phút)"
User: "30 phút"
Bot:  "Thời điểm mở đề? (mặc định: mở ngay)"
User: "Mở ngay"
Bot:  "Deadline nộp bài? (mặc định: không giới hạn)"
User: "Thứ 6 tuần này"
Bot:  → gọi assign_exam_to_class(exam_id=1, class_id=..., time_limit=1800, open_time=null, deadline="2026-06-13T23:59:00")
Bot:  "Đã giao đề 'Kiểm tra phép cộng' cho lớp 3A. Deadline: thứ 6, 13/06/2026."
```

**Acceptance criteria:**
- [ ] `POST /api/classes/:classId/exams` được gọi đúng params
- [ ] Tool label hiển thị "Đang giao bài tập cho lớp..."
- [ ] Chatbot xác nhận kết quả sau khi giao thành công
- [ ] Nếu đề đã được giao cho lớp này rồi → thông báo lỗi rõ ràng

---

## Out of Scope

- Hủy giao bài (unassign) qua chatbot
- Sửa thông tin giao bài đã tạo qua chatbot
- Giao 1 đề cho nhiều lớp cùng lúc trong 1 lệnh
- Parse ngày giờ từ tiếng Việt ("thứ 6 tuần này") — chatbot hỏi lại để lấy thông tin cụ thể hơn nếu cần

---

## Technical Approach

### Thay đổi file

| File | Thay đổi |
|------|----------|
| `backend/src/prompts/teacher-system.md` | Thêm section "Thu thập thông tin trước khi dùng tool" |
| `backend/src/chat/tools/assign-exam/definition.js` | **Mới** — OpenAI tool schema |
| `backend/src/chat/tools/assign-exam/handler.js` | **Mới** — gọi API assign exam |
| `backend/src/chat/tools/registry.js` | Đăng ký tool mới |

### Tool definition (assign_exam_to_class)

```js
{
  name: 'assign_exam_to_class',
  description: 'Giao đề thi cho một lớp học. Cần biết exam_id và class_id (dùng get_classes/get_exam_stats nếu chưa biết).',
  parameters: {
    exam_id:    { type: 'integer', description: 'ID đề thi' },         // required
    class_id:   { type: 'integer', description: 'ID lớp học' },        // required
    time_limit: { type: 'integer', description: 'Thời gian làm bài tính bằng giây (mặc định 1200)' },
    open_time:  { type: 'string',  description: 'Thời điểm mở đề, định dạng ISO 8601. Null = mở ngay.' },
    deadline:   { type: 'string',  description: 'Thời hạn nộp bài, định dạng ISO 8601. Null = không giới hạn.' },
  },
  required: ['exam_id', 'class_id']
}
```

### Handler

```js
// Gọi: POST /api/classes/:class_id/exams
// Body: { examId, timeLimit, openTime, deadline }
```

### System prompt addition

```markdown
# Thu thập thông tin trước khi dùng tool

Trước khi gọi bất kỳ tool nào, kiểm tra đủ tham số bắt buộc chưa:

1. Nếu thiếu thông tin bắt buộc → hỏi từng câu một, KHÔNG hỏi nhiều câu cùng lúc
2. Nếu cần ID (lesson_id, class_id, exam_id) mà chưa biết → dùng tool get_lessons/get_classes để lấy danh sách rồi hỏi thầy/cô chọn
3. Nếu thiếu thông tin tuỳ chọn → hỏi, và gợi ý giá trị mặc định trong ngoặc: "Thời gian làm bài? (mặc định 20 phút)"
4. Nếu thầy/cô bỏ qua hoặc nói "không cần" / "mặc định" → dùng giá trị mặc định, xác nhận rõ ràng trước khi gọi tool
5. KHÔNG tự bịa ID, tên lớp, tên đề — luôn lấy từ tool hoặc từ thầy/cô

Thứ tự hỏi khi giao bài tập: đề thi → lớp → thời gian làm → thời điểm mở → deadline
Thứ tự hỏi khi tạo đề: bài học → tên đề → số câu hỏi → chủ đề câu hỏi
```

---

## Boundaries

### Always Do
- Xác nhận lại thông tin trước khi thực hiện tác vụ quan trọng (giao bài, tạo đề)
- Thông báo rõ giá trị mặc định đang dùng khi bỏ qua tham số

### Ask First
- Nếu đề thi đã được giao cho lớp → hỏi có muốn cập nhật không

### Never Do
- Không tự bịa `exam_id`, `class_id`, hay bất kỳ ID nào
- Không gọi tool khi chưa đủ tham số bắt buộc
