# TODO: Gửi email thông báo tới phụ huynh

## Phase 1 — Foundation

- [x] **Task 1**: Thêm cột `email VARCHAR(100) NULL` vào bảng `student_relatives` trong `backend/database/create_db.js`

---

## Phase 2 — Backend Core

- [x] **Task 2.1**: `relative.schema.js` — thêm `email: z.string().email().nullable().optional()`
- [x] **Task 2.2**: `relative.repository.js` — `findByStudent()` SELECT thêm `email`
- [x] **Task 2.3**: `relative.repository.js` — `createRelative()` INSERT thêm `email`
- [x] **Task 2.4**: `relative.repository.js` — `updateRelative()` UPDATE thêm `email`
- [x] **Task 2.5**: `relative.repository.js` — thêm hàm `getEmailsByClassId(classId)` (JOIN users)
- [x] **Task 2.6**: `relative.service.js` — pass `email` qua `addRelative`, `updateRelative`; trả `email` trong `getRelatives`
- [x] **Task 2.7**: `relative.controller.js` — destructure `email` từ `req.body`

- [x] **Task 3.1**: Cài `nodemailer` — `npm install nodemailer` trong `backend/`
- [x] **Task 3.2**: Tạo `backend/src/utils/email.utils.js` với `sendAnnouncementEmail()`
- [x] **Task 3.3**: Cập nhật `backend/.env.example` — thêm `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

---

## Checkpoint: Backend infrastructure hoàn chỉnh ✅

- [x] `GET /api/students/:id/relatives` trả về field `email`
- [x] `POST /api/students/:id/relatives` với email → lưu DB thành công
- [x] `sendAnnouncementEmail()` có thể gọi độc lập

---

## Phase 3 — Integration

- [x] **Task 4.1**: `class.repository.js` — thêm hàm `getClassInfo(classId)` (JOIN users lấy teacher name)
- [x] **Task 4.2**: `class.service.js` — import `relativeRepo.getEmailsByClassId` và `sendAnnouncementEmail`
- [x] **Task 4.3**: `class.service.js` — thêm fire-and-forget block sau `createAnnouncement` DB call

---

## Phase 4 — Frontend

- [x] **Task 5.1**: `RelativeFormModal.jsx` — thêm input email (optional, sau phone)
- [x] **Task 5.2**: `StudentHome/index.jsx` — `email` tự động được pass qua `formData` object, không cần sửa

---

## Checkpoint: Feature Complete

- [x] Tạo thông báo → API `201` ngay lập tức (không delay)
- [x] Email gửi đến phụ huynh có email trong lớp (fire-and-forget)
- [x] Phụ huynh không có email → không lỗi (query filter `IS NOT NULL`)
- [x] SMTP chưa cấu hình → chỉ log warning, không crash
- [x] Form người thân có ô email, lưu và hiển thị đúng
