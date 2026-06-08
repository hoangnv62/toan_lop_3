# Feature: Gửi email thông báo tới phụ huynh

## Objective

Khi giáo viên tạo thông báo cho một lớp học, hệ thống tự động gửi email tới địa chỉ email của người thân (phụ huynh) các học sinh trong lớp đó, giúp phụ huynh nhận được thông tin kịp thời.

## Target Users

- **Giáo viên**: người tạo thông báo — không cần thao tác thêm, email tự động gửi.
- **Phụ huynh**: nhận email thông báo từ trường về lịch thi, nhắc bài, sự kiện lớp.

---

## Core Features

### 1. Thêm trường email vào người thân học sinh
- Thêm cột `email VARCHAR(100) NULL` vào bảng `student_relatives`.
- Cập nhật Zod schema, controller, repository của relatives để nhận và lưu email.
- Frontend: thêm ô nhập email (optional) trong form thêm/sửa người thân.
- **Acceptance criteria**: Giáo viên/học sinh có thể lưu email phụ huynh; field là tuỳ chọn, không bắt buộc.

### 2. Gửi email khi tạo thông báo
- Sau khi tạo thông báo thành công, hệ thống truy vấn danh sách học sinh của lớp, lấy tất cả relatives có email.
- Gửi email tới từng địa chỉ (fire-and-forget — không block response).
- **Acceptance criteria**: Email được gửi đến tất cả phụ huynh trong lớp có email đã đăng ký; API tạo thông báo vẫn trả về `201 Created` ngay lập tức dù email chưa gửi xong.

### 3. Nội dung email thông báo
- **Subject**: `[Thông báo lớp {tên lớp}] {tiêu đề thông báo}`
- **Body** (HTML): tên giáo viên, tên lớp, tiêu đề + nội dung thông báo, ngày giờ, footer thông tin trường.
- **Acceptance criteria**: Email hiển thị đúng tiếng Việt, không lỗi encoding.

### 4. Xử lý lỗi email
- Nếu gửi email thất bại (SMTP lỗi, email không tồn tại...): chỉ log lỗi ra console, không ảnh hưởng đến thông báo đã tạo.
- Không retry, không queue — đơn giản hoá cho quy mô nhỏ.
- **Acceptance criteria**: Khi SMTP down, thông báo vẫn được tạo; lỗi được log rõ địa chỉ email nào thất bại.

---

## Out of Scope

- Retry queue / job queue (không cài Bull/BullMQ).
- Gửi lại email thủ công (resend).
- Unsubscribe / opt-out cho phụ huynh.
- Email xác nhận khi phụ huynh đăng ký email.
- Tracking email (open/click rate).
- SMS (chỉ email).

---

## Technical Approach

### Schema migration

```sql
ALTER TABLE student_relatives
  ADD COLUMN email VARCHAR(100) NULL AFTER phone;
```

Cập nhật `database/create_db.js` để schema mới có cột email.

### Thư viện

```
nodemailer  ^6.x   — SMTP client
```

Cấu hình qua `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password     # Gmail App Password (2FA)
SMTP_FROM="Trường ABC <your-gmail@gmail.com>"
```

### File mới / sửa

| File | Thay đổi |
|------|---------|
| `backend/database/create_db.js` | Thêm cột `email` vào `student_relatives` |
| `backend/src/utils/email.utils.js` | Tạo mới — nodemailer transporter + `sendAnnouncementEmail()` |
| `backend/src/repositories/relative.repository.js` | Thêm query lấy relatives có email theo classId |
| `backend/src/services/class.service.js` | Gọi email utility sau khi tạo thông báo |
| `backend/src/validation/schema/relative.schema.js` | Thêm field `email` (optional, z.string().email()) |
| `backend/src/controllers/relative.controller.js` | Pass email vào create/update |
| `backend/src/repositories/relative.repository.js` | Insert/update email |
| `frontend/src/pages/student/StudentHome.jsx` | Thêm input email trong RelativesCard form |
| `backend/.env.example` | Thêm SMTP_* variables |

### Flow sau khi tạo thông báo

```
POST /api/classes/:id/announcements
  → classService.createAnnouncement(classId, teacherId, title, content)
      → classRepo.createAnnouncement(...)          // lưu DB, trả về id
      → res.status(201).json(...)                  // TRẢ VỀ NGAY
      → (async, fire-and-forget):
          relativeRepo.getEmailsByClassId(classId) // SELECT relatives có email
          emailUtils.sendAnnouncementEmail(...)     // gửi từng email
          // nếu lỗi → console.error, không throw
```

### Query lấy email phụ huynh theo lớp

```sql
SELECT sr.email, sr.name, u.full_name AS student_name
FROM student_relatives sr
JOIN users u ON u.id = sr.student_id
WHERE u.class_id = ?
  AND u.role = 'student'
  AND sr.email IS NOT NULL
  AND sr.email != ''
```

### Email template (nội dung)

```
Subject: [Thông báo lớp {class_name}] {title}

Kính gửi phụ huynh em {student_name},

Giáo viên {teacher_name} vừa gửi thông báo tới lớp {class_name}:

---
{title}

{content}
---

Thời gian: {created_at}

Trân trọng,
Hệ thống E-Learning Toán lớp 3
```

---

## API Contract

Không thay đổi API hiện tại. `POST /api/classes/:id/announcements` vẫn giữ nguyên request/response:

```json
// Request (không đổi)
{ "title": "string", "content": "string" }

// Response (không đổi)
{ "success": true, "data": { "id": 123 } }
```

Relatives API — thêm field `email`:

```json
// POST/PUT /api/students/:studentId/relatives
// PUT /api/relatives/:id
{
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "relationship": "Bố",
  "email": "nguyenvana@gmail.com"   // NEW — optional
}
```

---

## Testing Strategy

- Unit test: `sendAnnouncementEmail()` với mock transporter
- Integration: POST announcement → verify email function được gọi đúng params
- Manual: Gửi thật với Gmail sandbox

---

## Boundaries

### Always Do
- Email là nullable — không bắt buộc phụ huynh phải có email
- Luôn fire-and-forget, không block API response
- Log lỗi với địa chỉ email thất bại để debug

### Ask First
- Thay đổi UI form người thân (layout, vị trí field)
- Nội dung HTML template email

### Never Do
- Throw error từ email sending lên đến API response
- Gửi email chứa thông tin nhạy cảm (điểm số, mật khẩu)
- Commit SMTP credentials vào git
