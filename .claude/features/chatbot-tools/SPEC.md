# Feature: Bổ sung 5 Tool mới cho Chatbot Giáo viên

## Objective

Bổ sung 5 tool AI mới vào chatbot giáo viên để giáo viên có thể quản lý đề thi, theo dõi tiến độ học sinh và gửi thông báo hoàn toàn qua giao diện chat — không cần thao tác trên UI.

## Target Users

Giáo viên Toán lớp 3, sử dụng chatbot để thực hiện các tác vụ quản lý mà không cần rời khỏi cửa sổ chat.

---

## Core Features

### 1. Tool `delete_exam`

**Chức năng:** Xóa một đề thi thuộc quyền quản lý của giáo viên.

**Parameters:**
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `exam_id` | integer | ✅ | ID đề thi cần xóa |

**Logic handler:**
1. Gọi `examRepo.findByIdWithTeacher(exam_id, user.id)` — xác minh quyền sở hữu
2. Nếu không tồn tại → trả về lỗi "Đề thi không tồn tại hoặc không thuộc quyền quản lý của bạn"
3. Gọi `examService.deleteExam(exam_id)`

**Response:** `{ success, data: { examId, name }, message }`

**Acceptance criteria:**
- Không thể xóa đề thi của giáo viên khác
- Xóa thành công trả về tên đề thi đã xóa để xác nhận

---

### 2. Tool `update_exam`

**Chức năng:** Cập nhật đề thi — hỗ trợ 2 loại thao tác:
- **Loại A — Nội dung đề:** tên, mô tả, danh sách câu hỏi
- **Loại B — Thông tin giao đề:** deadline, time_limit, open_time (cần `class_id`)

**Parameters:**
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `exam_id` | integer | ✅ | ID đề thi |
| `name` | string | ❌ | Tên mới của đề thi |
| `description` | string | ❌ | Mô tả mới |
| `questions` | array | ❌ | Danh sách câu hỏi thay thế (cấu trúc giống `create_exam`) |
| `class_id` | integer | ❌ | Bắt buộc nếu muốn cập nhật thông tin giao đề |
| `time_limit` | integer | ❌ | Thời gian làm bài (giây) |
| `deadline` | string (ISO 8601) | ❌ | Thời hạn nộp |
| `open_time` | string (ISO 8601) | ❌ | Thời gian mở đề |

**Logic handler:**
1. Gọi `examRepo.findByIdWithTeacher(exam_id, user.id)` — xác minh quyền và lấy `lesson_id`
2. Nếu có `name` hoặc `description` hoặc `questions` → gọi `examService.updateExam(exam_id, lesson_id, name, description, questions)`
   - Validate questions: đúng 4 đáp án, đúng 1 đáp án đúng
   - Nếu `questions` không truyền → giữ nguyên câu hỏi cũ (pass câu hỏi hiện tại)
3. Nếu có `class_id` và bất kỳ trường assignment nào → gọi `classService.updateAssignment(class_id, user.id, exam_id, deadline, openTime, timeLimit)`
4. Cả hai loại có thể thực hiện trong cùng một lần gọi

**Response:** `{ success, data: { examId, updated: ['name', 'questions', 'assignment'] }, message }`

**Acceptance criteria:**
- Không thể sửa đề thi của giáo viên khác
- Nếu chỉ truyền `exam_id` mà không có trường nào khác → trả về lỗi "Không có thông tin nào để cập nhật"
- `questions` khi cập nhật: thay thế toàn bộ (full replace, không merge từng câu)
- Validation câu hỏi giống `create_exam`

---

### 3. Tool `get_student_progress`

**Chức năng:** Xem tiến độ học tập — hỗ trợ 2 cấp độ:
- **Theo học sinh cụ thể:** chuỗi điểm theo thời gian
- **Theo lớp:** tóm tắt điểm trung bình từng học sinh trong lớp

**Parameters:**
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `student_id` | integer | ❌ | ID học sinh (ít nhất 1 trong 2 phải có) |
| `class_id` | integer | ❌ | ID lớp học |

**Ràng buộc:** Phải truyền ít nhất 1 trong 2 (`student_id` hoặc `class_id`).

**Logic handler:**
- Nếu có `student_id` → gọi `studentService.getStudentProgress(student_id)` → trả về time-series điểm
- Nếu có `class_id` → gọi `classRepo.getStudentsWithAvg(class_id)` → trả về bảng tóm tắt điểm TB từng học sinh
- Nếu có cả hai → ưu tiên `student_id`

**Response (by student):** `{ success, data: { studentId, scores: [{ examName, score, submittedAt }] }, message }`
**Response (by class):** `{ success, data: { classId, students: [{ studentId, name, avgScore, submissionsCount }] }, message }`

**Acceptance criteria:**
- Không có thông số nào → trả về lỗi rõ ràng
- Học sinh không thuộc lớp của giáo viên → xử lý gracefully (trả về dữ liệu rỗng hoặc lỗi)

---

### 4. Tool `unassign_exam`

**Chức năng:** Hủy giao một đề thi khỏi một lớp học.

**Parameters:**
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `exam_id` | integer | ✅ | ID đề thi |
| `class_id` | integer | ✅ | ID lớp học |

**Logic handler:**
1. Gọi `classService.unassignExam(class_id, user.id, exam_id)` — service đã có ownership check

**Response:** `{ success, data: { examId, classId }, message }`

**Acceptance criteria:**
- Không thể hủy đề thi của lớp mình không quản lý
- Nếu đề chưa được giao cho lớp đó → trả về lỗi rõ ràng

---

### 5. Tool `create_announcement`

**Chức năng:** Đăng thông báo đến một hoặc nhiều lớp học cùng lúc.

**Parameters:**
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `title` | string | ✅ | Tiêu đề thông báo |
| `content` | string | ✅ | Nội dung thông báo |
| `class_ids` | array of integer | ✅ | Danh sách ID các lớp nhận thông báo |

**Logic handler:**
1. Validate: `class_ids` không rỗng
2. Loop qua từng `class_id` → gọi `classService.createAnnouncement(classId, user.id, title, content)`
3. Gom kết quả: ghi nhận class nào thành công, class nào lỗi

**Response:** `{ success, data: { sent: number, failed: number, classIds: [] }, message }`

**Acceptance criteria:**
- Không thể gửi thông báo đến lớp mình không quản lý
- Nếu một lớp lỗi → tiếp tục xử lý các lớp còn lại, báo cáo tổng kết cuối

---

## Out of Scope

- Xóa thông báo qua chatbot
- Clone đề thi qua chatbot
- Phân tích AI đề thi (`ai-feedback`, `ai-analysis`) qua chatbot
- Quản lý học sinh trong lớp qua chatbot

---

## Technical Approach

### Cấu trúc file mới (backend)

```
backend/src/chat/tools/
  delete-exam/
    definition.js
    handler.js
  update-exam/
    definition.js
    handler.js
  get-student-progress/
    definition.js
    handler.js
  unassign-exam/
    definition.js
    handler.js
  create-announcement/
    definition.js
    handler.js
```

### Thay đổi file hiện có

| File | Thay đổi |
|------|---------|
| `backend/src/chat/tools/registry.js` | Import và đăng ký 5 tool mới vào `TEACHER_TOOLS`, `TOOL_LABELS`, `toolRegistry` |
| `backend/src/prompts/teacher-system.md` | Bổ sung hướng dẫn sử dụng 5 tool mới vào bảng tool usage |

### Services & repos sử dụng (đã có sẵn)

| Tool | Service/Repo |
|------|-------------|
| `delete_exam` | `examRepo.findByIdWithTeacher`, `examService.deleteExam` |
| `update_exam` | `examRepo.findByIdWithTeacher`, `examService.updateExam`, `classService.updateAssignment` |
| `get_student_progress` | `studentService.getStudentProgress`, `classRepo.getStudentsWithAvg` |
| `unassign_exam` | `classService.unassignExam` |
| `create_announcement` | `classService.createAnnouncement` |

> Không cần thêm backend endpoint mới — tất cả logic đều gọi trực tiếp service/repo layer.

### Response envelope (nhất quán với các tool hiện có)

```js
{
  success: boolean,
  data: { ... },
  message: string,     // Tiếng Việt, thân thiện
  metadata: { tool: string, userId: number }
}
```

---

## Code Style

- Tuân theo pattern `definition.js` + `handler.js` của các tool hiện có
- Validate input bằng Zod ở đầu mỗi handler
- Gọi service layer, không gọi trực tiếp repository (ngoại trừ `get_student_progress` by class dùng `classRepo.getStudentsWithAvg`)
- Ownership check bắt buộc cho mọi thao tác write

---

## Boundaries

### Always Do
- Kiểm tra ownership trước mọi thao tác write (delete, update, unassign, announce)
- Trả về message tiếng Việt rõ ràng
- Validate input với Zod trước khi gọi service

### Ask First
- Nếu cần thêm service method mới (thay vì gọi repo trực tiếp)

### Never Do
- Bỏ qua ownership check
- Gọi HTTP endpoint (axios) từ trong tool handler — gọi service/repo trực tiếp
- Xóa dữ liệu mà không có bước verify trước
