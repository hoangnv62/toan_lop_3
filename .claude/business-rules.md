# Business Rules

## Phân quyền (Role)

Hệ thống có hai role cứng: `teacher` và `student`.

| Hành động | Teacher | Student |
|-----------|---------|---------|
| Quản lý lớp, bài học, đề thi | ✅ | ❌ |
| Xem/quản lý ngân hàng câu hỏi | ✅ (chỉ của mình) | ❌ |
| Giao đề thi cho lớp | ✅ | ❌ |
| Làm bài thi | ❌ | ✅ |
| Xem điểm của mình | ❌ | ✅ |
| Chatbot tool calling | ✅ | ❌ |
| Quản lý người thân | ❌ | ✅ |

---

## Quy tắc sở hữu dữ liệu

**Giáo viên chỉ được truy cập dữ liệu của mình:**
- Lớp học: `classes.teacher_id = req.user.user_id`
- Bài học: `lessons.teacher_id = req.user.user_id`
- Ngân hàng câu hỏi: `question_bank.teacher_id = req.user.user_id`
- Đề thi: phải đi qua bài học của giáo viên đó
- Thống kê học sinh: chỉ học sinh thuộc lớp do giáo viên quản lý

**Chat tool `get_student_stats`**: phải filter theo `teacher_id` trước khi trả kết quả. Không cho phép giáo viên xem dữ liệu lớp của giáo viên khác.

---

## Vòng đời đề thi

```
Tạo đề thi (lessonId)
  → Thêm câu hỏi (manual / AI generate / import Excel / chọn từ ngân hàng)
  → Giao cho lớp (classId, deadline, openTime, timeLimit)
  → Học sinh làm bài (submit answers)
  → Giáo viên xem kết quả, nhận xét
```

- Một đề thi có thể giao cho nhiều lớp (bảng `class_exams`)
- Một lớp không thể nhận cùng một đề thi hai lần (UNIQUE constraint `class_id + exam_id`)
- Xóa đề thi → cascade xóa câu hỏi, đáp án, bài làm học sinh

---

## Ngân hàng câu hỏi

- Mỗi câu hỏi trong ngân hàng thuộc về một giáo viên (`teacher_id`)
- Câu hỏi có thể liên kết với bài học (`lesson_id`, nullable)
- Mỗi câu hỏi có đúng 4 đáp án, trong đó chỉ 1 đáp án `is_correct = 1`
- Chat tool `save_questions_to_bank` phải validate: đúng 4 đáp án, đúng 1 đáp án đúng

---

## Câu hỏi trắc nghiệm

- Mỗi câu hỏi (`questions` hoặc `question_bank`) có đúng 4 đáp án
- Chỉ 1 đáp án `is_correct = 1`, 3 còn lại `is_correct = 0`
- Field `explanation` là optional

---

## Tính điểm

- Điểm = (số câu đúng / tổng số câu) × 10
- Làm tròn 1 chữ số thập phân
- Điểm lưu theo từng bài làm (`student_answers`), không có bảng điểm riêng
- Tính điểm khi query: JOIN `student_answers` → `answers` → `questions` → đếm `is_correct`

---

## Giới hạn AI Chat

- **Student**: tối đa 150 từ/câu trả lời, chỉ về Toán lớp 3
- **Teacher**: tối đa 200 từ/câu trả lời thông thường; tool calling không giới hạn về nội dung trả về
- Tool loop: tối đa 3 vòng lặp, timeout 30s
- Tools chỉ hoạt động khi `role === 'teacher'`

---

## Phân trang

Mọi danh sách có thể dài đều phải phân trang:
- Default `limit = 10`, max `limit = 50`
- Response format: `{ items, total, page, pages }`
- `pages = Math.max(1, Math.ceil(total / limit))`

---

## Thông báo lớp học (Announcements)

- Chỉ giáo viên tạo thông báo cho lớp của mình
- Học sinh trong lớp xem được thông báo
- Xóa thông báo: chỉ giáo viên tạo ra mới được xóa

---

## Người thân học sinh (Relatives)

- Học sinh tự quản lý danh sách người thân của mình
- Giáo viên không thấy và không quản lý thông tin người thân
