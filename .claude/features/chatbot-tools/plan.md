# Plan: Bổ sung 5 Tool mới cho Chatbot Giáo viên

## Phân tích codebase

### Pattern hiện có (cần tuân theo chính xác)

Mỗi tool gồm 2 file trong folder `backend/src/chat/tools/<tool-name>/`:
- `definition.js` — export `{ definition }` dạng OpenAI tool schema
- `handler.js` — export `{ handler }` async function `(args, user) => response`

Handler luôn:
1. Validate bằng Zod (safeParse) ở đầu
2. Gọi service/repo layer (không gọi HTTP)
3. Trả về `{ success, data, message, metadata: { tool, userId } }`
4. Catch lỗi: `try/catch` quanh service call, trả về `{ success: false, data: null, message: err.message }`

Sau khi tạo tool: cập nhật `registry.js` — 3 nơi: `TEACHER_TOOLS` (array), `TOOL_LABELS` (object), `toolRegistry` (object).

### Services sẵn có (không cần tạo thêm)

| Tool | Calls |
|------|-------|
| `delete_exam` | `examRepo.findByIdWithTeacher(examId, userId)` + `examService.deleteExam(examId)` |
| `update_exam` | `examRepo.findByIdWithTeacher(examId, userId)` + `examService.updateExam(...)` + `classService.updateAssignment(...)` |
| `get_student_progress` | `studentService.getStudentProgress(studentId)` / `classRepo.getStudentsWithScores(classId)` |
| `unassign_exam` | `classService.unassignExam(classId, userId, examId)` |
| `create_announcement` | `classService.createAnnouncement(classId, userId, title, content)` — loop per class |

### Điểm cần chú ý

- `examService.updateExam(examId, lessonId, ...)` yêu cầu `lessonId` → handler phải fetch exam trước để lấy `lesson_id`
- `getStudentsWithScores(classId)` trả về `[{ id, name, avg_score }]` — không có submission count, dùng `avg_score` là đủ
- `update_exam` hỗ trợ 2 path: nội dung đề (A) và thông tin giao đề (B) — handler detect dựa trên params có mặt
- `create_announcement` gửi nhiều lớp: loop + collect results, partial failure vẫn tiếp tục

---

## Thứ tự thực hiện

**Nguyên tắc:** Đơn giản → phức tạp, risk-first sau khi pattern được xác lập.

1. `delete_exam` — đơn giản nhất, xác lập pattern ownership check
2. `unassign_exam` — đơn giản, service đã có ownership check
3. `create_announcement` — trung bình, pattern loop + partial failure
4. `get_student_progress` — trung bình, 2 query path
5. `update_exam` — phức tạp nhất (2 operation type + question validation)
6. Cập nhật `teacher-system.md` — cuối cùng sau khi tất cả tool hoạt động

---

## Task 1: Tool `delete_exam`

**Objective:** Giáo viên có thể xóa đề thi của mình qua chatbot.

**Files:**
- `backend/src/chat/tools/delete-exam/definition.js` — tạo mới
- `backend/src/chat/tools/delete-exam/handler.js` — tạo mới
- `backend/src/chat/tools/registry.js` — thêm entry

**Logic handler:**
```
1. Zod parse: { exam_id: z.number().int().positive() }
2. examRepo.findByIdWithTeacher(exam_id, user.id) → nếu null → lỗi ownership
3. examService.deleteExam(exam_id)
4. Return { success: true, data: { examId, name: exam.name }, message: `Đã xóa đề thi "${exam.name}"` }
```

**Acceptance criteria:**
- [ ] Ownership check: không xóa được đề của giáo viên khác
- [ ] Response chứa `name` đề thi đã xóa
- [ ] Registry cập nhật đúng 3 nơi

---

## Task 2: Tool `unassign_exam`

**Objective:** Giáo viên có thể hủy giao đề thi khỏi một lớp qua chatbot.

**Files:**
- `backend/src/chat/tools/unassign-exam/definition.js` — tạo mới
- `backend/src/chat/tools/unassign-exam/handler.js` — tạo mới
- `backend/src/chat/tools/registry.js` — thêm entry

**Logic handler:**
```
1. Zod parse: { exam_id, class_id: z.number().int().positive() }
2. try { classService.unassignExam(class_id, user.id, exam_id) }
   catch (err) → return error (service ném lỗi nếu không có quyền hoặc không tồn tại)
3. Fetch exam + class name để message thân thiện
4. Return { success: true, data: { examId, classId }, message: `Đã hủy giao đề "..." khỏi lớp "..."` }
```

**Acceptance criteria:**
- [ ] Không hủy được đề của lớp mình không quản lý
- [ ] Message xác nhận tên đề + tên lớp

---

## Task 3: Tool `create_announcement`

**Objective:** Giáo viên gửi thông báo đến một hoặc nhiều lớp cùng lúc qua chatbot.

**Files:**
- `backend/src/chat/tools/create-announcement/definition.js` — tạo mới
- `backend/src/chat/tools/create-announcement/handler.js` — tạo mới
- `backend/src/chat/tools/registry.js` — thêm entry

**Logic handler:**
```
1. Zod parse: { title, content: z.string().min(1), class_ids: z.array(z.number().int().positive()).min(1) }
2. Loop qua class_ids:
   - try { await classService.createAnnouncement(classId, user.id, title, content) → push to sent[] }
   - catch (err) → push to failed[] với { classId, reason: err.message }
3. success = failed.length === 0
4. Return { success, data: { sent: sent.length, failed: failed.length, sentClassIds: sent, failedDetails: failed },
            message: `Đã gửi thông báo "${title}" đến ${sent.length}/${class_ids.length} lớp.` }
```

**Acceptance criteria:**
- [ ] Partial failure tiếp tục xử lý các lớp còn lại
- [ ] Response báo cáo rõ sent/failed count
- [ ] Không gửi được đến lớp không quản lý (service throw → caught)

---

## Checkpoint A: Simple tools complete

Trước khi sang task 4–6, verify:
- [ ] 3 tool đã đăng ký trong registry.js
- [ ] Tool labels tiếng Việt đúng format
- [ ] Test thủ công: hỏi chatbot "xóa đề số X", "hủy giao đề X khỏi lớp Y", "gửi thông báo đến lớp A và B"

---

## Task 4: Tool `get_student_progress`

**Objective:** Giáo viên xem tiến độ học tập — theo từng học sinh hoặc theo cả lớp.

**Files:**
- `backend/src/chat/tools/get-student-progress/definition.js` — tạo mới
- `backend/src/chat/tools/get-student-progress/handler.js` — tạo mới
- `backend/src/chat/tools/registry.js` — thêm entry

**Logic handler:**
```
1. Zod parse: { student_id?: z.number().int().positive().optional(),
                class_id?: z.number().int().positive().optional() }
2. if (!student_id && !class_id) → lỗi "Vui lòng cung cấp student_id hoặc class_id"
3. if (student_id):
   - rows = await studentService.getStudentProgress(student_id)
   - Return time-series: { studentId, scores: [{ examName, score, submittedAt }] }
4. else (class_id):
   - rows = await classRepo.getStudentsWithScores(class_id)
   - Return summary: { classId, students: [{ studentId: id, name, avgScore: avg_score }] }
```

**Acceptance criteria:**
- [ ] Không truyền param → lỗi rõ ràng
- [ ] `student_id` → time-series array
- [ ] `class_id` → array học sinh + avgScore
- [ ] Cả hai → ưu tiên `student_id`

---

## Task 5: Tool `update_exam`

**Objective:** Giáo viên sửa tên/mô tả/câu hỏi đề thi hoặc cập nhật thông tin giao đề qua chatbot.

**Files:**
- `backend/src/chat/tools/update-exam/definition.js` — tạo mới
- `backend/src/chat/tools/update-exam/handler.js` — tạo mới
- `backend/src/chat/tools/registry.js` — thêm entry

**Logic handler:**
```
1. Zod parse:
   {
     exam_id: z.number().int().positive(),
     name?: z.string().min(1).optional(),
     description?: z.string().optional(),
     questions?: z.array(questionSchema).optional(),   // same schema as create_exam
     class_id?: z.number().int().positive().optional(),
     time_limit?: z.number().int().positive().optional(),
     deadline?: z.string().optional().nullable(),
     open_time?: z.string().optional().nullable(),
   }

2. Kiểm tra có ít nhất 1 field thay đổi:
   const hasContentUpdate = name || description !== undefined || questions
   const hasAssignmentUpdate = class_id && (time_limit || deadline !== undefined || open_time !== undefined)
   if (!hasContentUpdate && !hasAssignmentUpdate) → lỗi "Không có thông tin nào để cập nhật"

3. Ownership check:
   const exam = await examRepo.findByIdWithTeacher(exam_id, user.id)
   if (!exam) → lỗi ownership

4. if (hasContentUpdate):
   - Validate questions nếu có: đúng 4 đáp án, đúng 1 đáp án đúng
   - Nếu questions không truyền: fetch câu hỏi hiện tại để pass vào updateExam
     (hoặc handle null questions trong service — cần check examRepo.updateExam behavior)
   - await examService.updateExam(exam_id, exam.lesson_id, name ?? exam.name,
       description ?? exam.description, questionsData)
   - updated.push('content')

5. if (hasAssignmentUpdate):
   - await classService.updateAssignment(class_id, user.id, exam_id, deadline, open_time, time_limit)
   - updated.push('assignment')

6. Return { success: true, data: { examId, updated }, message: tóm tắt thay đổi }
```

**Chú ý quan trọng:** `examService.updateExam` hiện tại luôn thay thế toàn bộ câu hỏi — nếu không truyền `questions`, handler phải fetch câu hỏi hiện tại từ `examRepo.findWithQuestions(exam_id)` rồi pass lại để tránh xóa hết câu hỏi.

**Acceptance criteria:**
- [ ] Không sửa được đề của giáo viên khác
- [ ] Chỉ truyền `exam_id` → lỗi "Không có thông tin nào để cập nhật"
- [ ] Cập nhật name/description không làm mất câu hỏi cũ
- [ ] Validate questions format nếu có
- [ ] Cả 2 loại update có thể trong cùng 1 lần gọi

---

## Checkpoint B: All tools complete

- [ ] 5 tool đăng ký đủ trong registry.js
- [ ] 5 TOOL_LABELS tiếng Việt

---

## Task 6: Cập nhật `teacher-system.md`

**Objective:** AI biết khi nào dùng 5 tool mới.

**Files:**
- `backend/src/prompts/teacher-system.md` — thêm 5 dòng vào bảng "Khi nào dùng Tool"

**Nội dung bổ sung (5 dòng mới vào bảng):**
| Yêu cầu | Tool |
|---------|------|
| Xóa đề thi | `delete_exam` (cần exam_id — dùng `get_lessons` trước nếu chưa biết) |
| Sửa tên/mô tả/câu hỏi đề thi | `update_exam` (cần exam_id) |
| Sửa deadline/thời gian của đề đã giao | `update_exam` (cần exam_id + class_id) |
| Hủy giao đề khỏi lớp | `unassign_exam` (cần exam_id + class_id) |
| Xem tiến độ học sinh | `get_student_progress` (student_id hoặc class_id) |
| Gửi thông báo đến lớp | `create_announcement` (cần title, content, class_ids) |

**Thứ tự hỏi khi xóa/sửa đề:** hỏi exam_id trước, xác nhận tên đề, rồi thực hiện

**Acceptance criteria:**
- [ ] Bảng tool usage đầy đủ 5 tool mới
- [ ] Hướng dẫn xác nhận trước khi xóa (destructive operation)

---

## Tổng kết files thay đổi

| File | Loại thay đổi |
|------|--------------|
| `backend/src/chat/tools/delete-exam/definition.js` | Tạo mới |
| `backend/src/chat/tools/delete-exam/handler.js` | Tạo mới |
| `backend/src/chat/tools/unassign-exam/definition.js` | Tạo mới |
| `backend/src/chat/tools/unassign-exam/handler.js` | Tạo mới |
| `backend/src/chat/tools/create-announcement/definition.js` | Tạo mới |
| `backend/src/chat/tools/create-announcement/handler.js` | Tạo mới |
| `backend/src/chat/tools/get-student-progress/definition.js` | Tạo mới |
| `backend/src/chat/tools/get-student-progress/handler.js` | Tạo mới |
| `backend/src/chat/tools/update-exam/definition.js` | Tạo mới |
| `backend/src/chat/tools/update-exam/handler.js` | Tạo mới |
| `backend/src/chat/tools/registry.js` | Sửa — thêm 5 imports + 5 entries |
| `backend/src/prompts/teacher-system.md` | Sửa — thêm 6 dòng vào bảng tool |
