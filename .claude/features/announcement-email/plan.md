# Plan: Gửi email thông báo tới phụ huynh

## Context

Khi giáo viên tạo thông báo cho lớp học, hệ thống gửi email tự động đến phụ huynh (relatives) của học sinh trong lớp đó. Email gửi fire-and-forget — không block API response.

## Dependency Graph

```
Task 1 (DB schema)
  ├── Task 2 (Relatives API — backend)
  │     └── Task 4 (Wire email → announcement)
  └── Task 5 (Frontend form)
Task 3 (Email utility)  ←── cũng là input của Task 4
```

## Vertical Slices

---

### Task 1 — DB Schema: Thêm cột `email` vào `student_relatives`

**Objective**: Chuẩn bị schema để lưu email phụ huynh.

**Files**:
- `backend/database/create_db.js` — thêm `email VARCHAR(100) NULL` vào DDL của `student_relatives`

**Chi tiết**:
```sql
-- Trong CREATE TABLE student_relatives, thêm sau cột phone:
email VARCHAR(100) NULL,
```

**Acceptance Criteria**:
- [ ] `create_db.js` có cột `email VARCHAR(100) NULL` trong bảng `student_relatives`
- [ ] Cột nằm sau `phone`, trước `relationship`

**Dependencies**: Không có

---

### Task 2 — Backend: Relatives layer hỗ trợ email

**Objective**: Toàn bộ tầng backend của relatives (schema → repo → service → controller) nhận và trả về field `email`.

**Files**:
- `backend/src/validation/schema/relative.schema.js` — thêm `email` optional
- `backend/src/repositories/relative.repository.js` — 4 thay đổi:
  1. `findByStudent()` — SELECT thêm `email`
  2. `createRelative()` — INSERT thêm `email`
  3. `updateRelative()` — UPDATE thêm `email`
  4. Hàm mới `getEmailsByClassId(classId)` — query JOIN lấy emails phụ huynh theo lớp
- `backend/src/services/relative.service.js` — pass `email` qua `addRelative`, `updateRelative`; trả `email` trong `getRelatives`
- `backend/src/controllers/relative.controller.js` — destructure `email` từ `req.body`

**Chi tiết**:

`relative.schema.js`:
```javascript
email: z.string().email('Email không hợp lệ').nullable().optional(),
```

`getEmailsByClassId` query:
```sql
SELECT sr.email, sr.name AS relativeName, u.full_name AS studentName
FROM student_relatives sr
JOIN users u ON u.id = sr.student_id
WHERE u.class_id = :classId
  AND u.role = 'student'
  AND sr.email IS NOT NULL
  AND sr.email != ''
```

**Acceptance Criteria**:
- [ ] `POST /api/students/:id/relatives` với `{ email: "test@gmail.com" }` → lưu vào DB
- [ ] `GET /api/students/:id/relatives` → trả về field `email` trong mỗi relative
- [ ] `PUT /api/relatives/:id` cập nhật được email
- [ ] `email: null` vẫn cho phép (optional field)
- [ ] Email sai format bị Zod từ chối với 422

**Dependencies**: Task 1

---

### Task 3 — Backend: Email utility (nodemailer)

**Objective**: Tạo utility gửi email độc lập, có thể test riêng.

**Files**:
- `backend/src/utils/email.utils.js` — tạo mới
- `backend/.env.example` — thêm SMTP_* vars
- `backend/package.json` — thêm `nodemailer` dependency (cài `npm install nodemailer`)

**Chi tiết `email.utils.js`**:
```javascript
// Tạo transporter 1 lần (lazy init khi first use)
// Export hàm sendAnnouncementEmail(to, relativeName, studentName, className, teacherName, title, content)
// HTML template tiếng Việt: subject, body với tất cả thông tin
// Nếu SMTP chưa cấu hình → log warning, không throw
```

**Template email**:
- **Subject**: `[Thông báo lớp {className}] {title}`
- **Body HTML**: tên phụ huynh, tên học sinh, tên giáo viên, tên lớp, nội dung thông báo, ngày giờ, footer

**`.env.example` additions**:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Trường ABC <your-gmail@gmail.com>"
```

**Acceptance Criteria**:
- [ ] `email.utils.js` export `sendAnnouncementEmail()`
- [ ] Nếu `SMTP_USER` không có trong env → log warning, return sớm (không crash)
- [ ] `.env.example` có đầy đủ SMTP vars với comment hướng dẫn
- [ ] HTML email encode đúng tiếng Việt (charset utf-8)

**Dependencies**: Không có (task độc lập)

---

### Task 4 — Backend: Wire email → announcement creation

**Objective**: Khi tạo thông báo thành công → gửi email fire-and-forget đến phụ huynh có email trong lớp.

**Files**:
- `backend/src/repositories/class.repository.js` — thêm `getClassInfo(classId)` trả về `{className, teacherName}`
- `backend/src/services/class.service.js` — cập nhật `createAnnouncement()`: sau DB insert, fire-and-forget gửi email

**Chi tiết `getClassInfo` query**:
```sql
SELECT c.class_name, u.full_name AS teacher_name
FROM classes c
JOIN users u ON u.id = c.teacher_id
WHERE c.id = :classId
```

**Chi tiết `class.service.js`**:
```javascript
export const createAnnouncement = async (classId, teacherId, title, content) => {
  if (!await classRepo.findByIdAndTeacher(classId, teacherId)) throw new NotFoundError('...');
  const id = await classRepo.createAnnouncement(classId, teacherId, title, content);

  // Fire-and-forget — không await, không block response
  (async () => {
    try {
      const [classInfo, recipients] = await Promise.all([
        classRepo.getClassInfo(classId),
        relativeRepo.getEmailsByClassId(classId),
      ]);
      for (const r of recipients) {
        await sendAnnouncementEmail(
          r.email, r.relativeName, r.studentName,
          classInfo.className, classInfo.teacherName,
          title, content
        );
      }
    } catch (err) {
      console.error('[Email] Announcement email error:', err.message);
    }
  })();

  return id;
};
```

**Acceptance Criteria**:
- [ ] Tạo thông báo → API trả `201` ngay, không delay
- [ ] Email được gửi đến tất cả phụ huynh có email trong lớp
- [ ] Nếu SMTP lỗi → thông báo vẫn được tạo, lỗi chỉ xuất hiện trong console
- [ ] Lớp không có phụ huynh nào có email → không lỗi, không gửi gì

**Dependencies**: Task 2, Task 3

---

### Task 5 — Frontend: Thêm field email vào form người thân

**Objective**: Phụ huynh/học sinh có thể nhập email khi thêm/sửa người thân.

**Files**:
- `frontend/src/pages/student/StudentHome/RelativeFormModal.jsx` — thêm input email (optional)
- `frontend/src/pages/student/StudentHome/index.jsx` — pass email từ form state lên API

**Chi tiết**:
- Input email nằm sau input phone trong form
- Placeholder: `Email phụ huynh (tuỳ chọn)`
- Không required — phụ huynh không có email vẫn cho thêm
- Khi edit: pre-fill email hiện tại từ data

**Acceptance Criteria**:
- [ ] Form hiển thị ô nhập email (label: "Email", optional)
- [ ] Thêm người thân với email → lưu được
- [ ] Sửa người thân → email hiện tại hiển thị đúng trong form
- [ ] Xóa email (để trống) → lưu null, không lỗi

**Dependencies**: Task 1 (backend phải nhận email trước)

---

## Checkpoint: Feature Complete

Verify trước khi đóng feature:
- [ ] Tạo thông báo → email gửi đến đúng phụ huynh có email trong lớp
- [ ] API response không bị delay bởi email
- [ ] Phụ huynh không có email → không ảnh hưởng
- [ ] SMTP cấu hình sai → log error, thông báo vẫn tạo thành công
- [ ] Form người thân hiển thị và lưu email đúng

## Thứ tự thực hiện

```
Task 1 → Task 2 ──┐
Task 1 → Task 3 ──┴──→ Task 4
Task 1 → Task 5 (có thể song song Task 2)
```

Thời gian ước tính: 2–3 giờ
