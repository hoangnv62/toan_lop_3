# Hướng dẫn tạo Slide thuyết trình — E-Learning Toán lớp 3

> **Dành cho AI Agent:** Tài liệu đặc tả 20 slide thuyết trình cho dự án **Nền tảng E-learning Toán lớp 3**. Tập trung vào **kiến trúc tổng thể** — không đi sâu vào từng chức năng cụ thể hay chi tiết công nghệ.Sử dụng animation cho các trang slide, Đọc toàn bộ trước khi bắt đầu.

---
## Yêu cầu xuất file

### Định dạng đầu ra

Ưu tiên theo thứ tự:

1. Microsoft PowerPoint (.pptx)
2. Canva Presentation
3. Google Slides

### Hiệu ứng chuyển slide

Áp dụng cho toàn bộ slide:

- Transition: Fade
- Duration: 0.5 - 0.8 giây
- Không sử dụng hiệu ứng gây rối mắt (Bounce, Spin, Zoom mạnh)
- Chuyển slide đồng nhất toàn bộ bài

### Hiệu ứng xuất hiện nội dung

Bullet point:
- Appear hoặc Fade
- Xuất hiện lần lượt từng dòng

Biểu đồ:
- Fade In

Sơ đồ kiến trúc:
- Xuất hiện theo từng tầng
  - Client
  - Backend
  - Database
  - AI Service

Ảnh minh họa:
- Fade In

### Nguyên tắc animation

- Tối đa 2 loại animation trong toàn bộ bài
- Ưu tiên tính chuyên nghiệp hơn hiệu ứng
- Không dùng âm thanh
- Không dùng hiệu ứng xoay, nhảy hoặc flashing
## Quy ước chung

| Quy ước | Giá trị |
|---|---|
| Ngôn ngữ | Tiếng Việt (thuật ngữ kỹ thuật giữ nguyên tiếng Anh) |
| Font | Inter hoặc Be Vietnam Pro |
| Màu chủ đạo | Indigo `#4F46E5` — trắng — xám nhạt |
| Accent | Xanh lá `#10B981` · Vàng `#F59E0B` · Tím `#8B5CF6` |
| Tổng số slide | **20 slide** |
| Sơ đồ | Mermaid diagram hoặc ASCII box-drawing |
| Số trang | Góc dưới phải mỗi slide |

---

# PHẦN 1 — GIỚI THIỆU (Slide 1–3)

---

## Slide 1 — Trang bìa

**Bố cục:** Toàn màn hình, nền gradient indigo → tím nhạt, text trắng.

**Nội dung:**
- **Tiêu đề lớn:** Nền tảng E-Learning Toán lớp 3
- **Tiêu đề phụ:** Hệ thống quản lý lớp học & kiểm tra thông minh với AI
- **Logo:** Trường Đại học Xây dựng Hà Nội (đặt góc trên trái)
- **Thông tin nhóm:** *(để trống — agent không tự điền)*
- **Năm:** 2025

---

## Slide 2 — Mục lục

**Bố cục:** 2 cột, số thứ tự màu indigo, mỗi phần có icon phân biệt.

**Nội dung:**

| # | Phần | Icon gợi ý |
|---|---|---|
| 1 | Giới thiệu dự án | 📌 |
| 2 | Kiến trúc hệ thống | 🏗️ |
| 3 | Thiết kế | 🗄️ |
| 4 | AI tạo đề thi | 🤖 |
| 5 | Demo | 🖥️ |
| 6 | Kết luận | 🎯 |

---

## Slide 3 — Giới thiệu dự án

**Bố cục:** Chia đôi ngang — trái: vấn đề (nền vàng nhạt), phải: giải pháp (nền xanh nhạt).

**Vấn đề (trái):**
- Soạn đề kiểm tra thủ công tốn nhiều thời gian
- Khó theo dõi tiến độ học sinh theo thời gian thực
- Phụ huynh thiếu kênh cập nhật kết quả

**Giải pháp (phải):**
- Hệ thống số hóa toàn bộ quy trình dạy–học–kiểm tra
- AI (OpenRouter) tự động sinh câu hỏi trắc nghiệm
- Dashboard thống kê trực quan cho giáo viên

**Đối tượng:** Giáo viên · Học sinh lớp 3

---

# PHẦN 2 — KIẾN TRÚC HỆ THỐNG (Slide 4–7)

---

## Slide 4 — Kiến trúc tổng quan

**Mục tiêu:** Toàn cảnh hệ thống 3 tầng + AI service.

**Bố cục:** Sơ đồ chiếm 75% slide, ghi chú kỹ thuật 25% bên phải.

**Sơ đồ kiến trúc:**

> 📷 **[ CHÈN ẢNH: Sơ đồ kiến trúc 3 tầng + AI service ]**
> Căn giữa · Chiều rộng ~75% slide · Nền trắng hoặc trong suốt

**Ghi chú kỹ thuật (bên phải):**
- Auth: JWT stateless · HS256 · 24h expiry
- CORS: Whitelist localhost 5173 / 5000
- DB Pool: 10 connections · mariadb npm package
- AI: Tool calling 7 tools · fallback cứng khi lỗi

---

## Slide 5 — Kiến trúc triển khai

**Mục tiêu:** Cho thấy hệ thống chạy như thế nào ở môi trường thực.

**Bố cục:** Sơ đồ deployment diagram chiếm toàn slide.

**Sơ đồ triển khai:**

> 📷 **[ CHÈN ẢNH: Deployment diagram — Frontend · Backend · MariaDB · OpenRouter API ]**
> Căn giữa · Chiều rộng ~85% slide · Nền trắng hoặc trong suốt

**Điểm nhấn (box dưới sơ đồ):**
- Frontend và Backend chạy **độc lập** — tách biệt hoàn toàn
- Giao tiếp qua REST API, không dùng server-side rendering
- AI là **external service** — không cần host, tính phí theo token

---

## Slide 6 — Công nghệ sử dụng

**Mục tiêu:** Cái nhìn tổng quan stack, không đi sâu từng thư viện.

**Bố cục:** 3 cột card — Backend · Frontend · AI & Tools.

**Card 1 — Backend**
```
Node.js (LTS) + Express.js 5
MariaDB / MySQL — Raw SQL
JWT HS256 (24h) + bcryptjs
xlsx / SheetJS (Excel)
pdfkit (PDF) · Zod (Validation)
```

**Card 2 — Frontend**
```
React 19 + Vite
Tailwind CSS 3
React Router v7
chart.js + react-chartjs-2
react-icons/fi · react-toastify
```

**Card 3 — AI & Tools**
```
OpenRouter AI
openai SDK (→ openrouter.ai)
Model: gpt-oss-120b:free
Tool Calling (7 tools)
Fallback Strategy
```

**Điểm nhấn (dưới 3 card):**
> Toàn bộ stack là **open-source** (trừ OpenRouter API) — không tốn chi phí license.

---

## Slide 7 — Luồng nghiệp vụ chính

**Mục tiêu:** Cho thấy hệ thống vận hành theo 2 luồng song song: Giáo viên và Học sinh.

**Bố cục:** 2 luồng song song, từ trái (GV) sang phải (HS), gặp nhau ở giữa tại "Đề thi".

**Sơ đồ luồng:**

> 📷 **[ CHÈN ẢNH: Luồng nghiệp vụ song song — Giáo viên (trái) & Học sinh (phải) ]**
> Căn giữa · Chiều rộng ~90% slide · Nền trắng hoặc trong suốt

---

# PHẦN 3 — THIẾT KẾ (Slide 8–12)

---

## Slide 8 — ERD tổng quan

**Mục tiêu:** Toàn cảnh 16 bảng và quan hệ giữa chúng.

**Bố cục:** ERD chiếm toàn slide, chú thích ngắn phía dưới.

**Sơ đồ ERD:**

> 📷 **[ CHÈN ẢNH: ERD — 16 bảng và quan hệ ]**
> Căn giữa · Chiều rộng ~95% slide · Nền trắng hoặc trong suốt

**Chú thích:** 16 bảng · charset utf8mb4 · MariaDB / MySQL · Connection Pool 10 kết nối

---

## Slide 9 — Bảng dữ liệu quan trọng

**Mục tiêu:** Zoom vào 4 bảng cốt lõi quyết định logic hệ thống.

**Bố cục:** 4 card dạng 2×2 grid, nền xám nhạt, border indigo.

**Card 1 — `users` (Người dùng)**
```
id | username | password | full_name
role: ENUM('teacher','student')   ← phân quyền duy nhất
class_id → FK classes             ← học sinh thuộc lớp nào
```
> Một bảng cho cả Giáo viên và Học sinh — phân biệt bằng `role`

**Card 2 — `class_exams` (Phân công đề)**
```
class_id → FK classes
exam_id  → FK exams
deadline  | open_time | time_limit (giây)
UNIQUE(class_id, exam_id)
```
> Bảng trung gian nhiều–nhiều, kiểm soát thời hạn và giới hạn giờ làm

**Card 3 — `student_answers` (Bài làm)**
```
student_id → FK users
exam_id    → FK exams
answer_id  → FK answers           ← lưu từng câu đã chọn
time_spent | submitted_at
```
> Lưu TỪNG câu trả lời → tính điểm chi tiết, phân tích sai sót

**Card 4 — `question_bank` (Ngân hàng)**
```
teacher_id → FK users
content | explanation
→ question_bank_answers (is_correct)
```
> Tách biệt với `exams` → câu hỏi tái sử dụng nhiều đề

---

## Slide 10 — Use Case — Giáo viên

**Mục tiêu:** Toàn bộ nghiệp vụ của actor Teacher ở mức tổng quan.

**Bố cục:** Sơ đồ Use Case Giáo viên chiếm toàn slide.

> 📷 **[ CHÈN ẢNH: Use Case Diagram — Actor Giáo viên ]**
> Căn giữa · Chiều rộng ~85% slide · Nền trắng hoặc trong suốt

---

## Slide 11 — Use Case — Học sinh

**Mục tiêu:** Toàn bộ nghiệp vụ của actor Student.

**Bố cục:** Sơ đồ cây trái, bảng so sánh quyền hạn phải.

**Use Case Học sinh (trái):**

> 📷 **[ CHÈN ẢNH: Use Case Diagram — Actor Học sinh ]**
> Chiều rộng ~55% slide (để nhường chỗ bảng so sánh bên phải)

**Bảng so sánh quyền (phải):**

| Chức năng | GV | HS |
|---|:---:|:---:|
| Tạo / Quản lý đề thi | ✅ | ❌ |
| Làm bài kiểm tra | ❌ | ✅ |
| AI sinh câu hỏi | ✅ | ❌ |
| Xem bảng xếp hạng | ❌ | ✅ |
| Dashboard & AI lời khuyên | ✅ | ❌ |
| Export Excel kết quả | ✅ | ❌ |

---

## Slide 12 — Sequence Diagram tổng quát

**Mục tiêu:** Một sơ đồ sequence bao quát cả 2 luồng chính trong hệ thống.

**Bố cục:** Sequence diagram chiếm toàn slide.

> 📷 **[ CHÈN ẢNH: Sequence Diagram tổng quát — GV · HS · React · Express · MariaDB · OpenRouter ]**
> Căn giữa · Chiều rộng ~95% slide · Nền trắng hoặc trong suốt

---

# PHẦN 4 — AI TẠO ĐỀ THI (Slide 13–15)

---

## Slide 13 — AI tổng quan

**Mục tiêu:** Giới thiệu vai trò AI trong hệ thống ở mức cao.

**Bố cục:** 3 card ngang + 1 highlight box phía dưới.

**Card 1 — Mô hình**
```
OpenRouter AI
openai SDK → openrouter.ai/api/v1
Model: gpt-oss-120b:free
```

**Card 2 — Tính năng AI**
```
① AI Chatbot (Teacher) — 7 tool calls
   search_question_bank · get_classes
   get_lessons · create_exam
   save_questions_to_bank
   get_student_stats · get_exam_stats

② Lời khuyên giảng dạy (Dashboard)
   Input : phân phối điểm lớp
   Output: gợi ý bằng tiếng Việt
```

**Card 3 — Giá trị mang lại**
```
Tiết kiệm thời gian soạn đề & tra cứu
Chatbot hiểu ngữ cảnh vai trò giáo viên
Giáo viên vẫn review trước khi lưu
Fallback tự động khi AI không phản hồi
```

**Highlight box:**
> AI **không thay thế** giáo viên — AI là công cụ hỗ trợ, giáo viên vẫn kiểm soát và phê duyệt toàn bộ nội dung trước khi đưa vào đề thi.

---

## Slide 14 — Kiến trúc AI Integration

**Mục tiêu:** Cho thấy AI được tích hợp vào hệ thống như thế nào về mặt kỹ thuật.

**Bố cục:** Sơ đồ luồng dữ liệu từ trái sang phải.

**Sơ đồ tích hợp:**

> 📷 **[ CHÈN ẢNH: AI Integration — React → Express → OpenRouter API → MariaDB ]**
> Căn giữa · Chiều rộng ~85% slide · Nền trắng hoặc trong suốt

**Điểm kỹ thuật quan trọng (dưới sơ đồ):**
- Chatbot sử dụng **tool calling** — AI quyết định gọi tool nào dựa trên tin nhắn giáo viên
- Câu hỏi **không lưu DB** ngay khi AI sinh — chỉ lưu sau khi giáo viên xác nhận
- Fallback: nếu AI lỗi → trả về phản hồi mẫu cứng để UX không bị gián đoạn

---

## Slide 15 — Luồng sinh đề thi bằng AI

**Mục tiêu:** Sequence diagram chi tiết cho tính năng AI sinh câu hỏi.

**Bố cục:** Sequence diagram chiếm toàn slide.

> 📷 **[ CHÈN ẢNH: Sequence Diagram — Luồng AI Chatbot tool calling từ GV đến lưu DB ]**
> Căn giữa · Chiều rộng ~95% slide · Nền trắng hoặc trong suốt

---

# PHẦN 5 — DEMO (Slide 16–18)

---

## Slide 16 — Demo: Dashboard Giáo viên

**Mục tiêu:** Cho người xem thấy giao diện giáo viên thực tế.

**Bố cục:** 1 ảnh chụp màn hình lớn + danh sách điểm nổi bật bên phải.

**Placeholder ảnh:** `[Screenshot: /dashboard — trang Dashboard giáo viên]`

**Điểm nổi bật (bullet bên phải):**
- Thống kê tổng quan: số lớp, số học sinh, số đề thi
- Biểu đồ điểm trung bình từng lớp
- Bảng top học sinh xuất sắc
- Khung **AI lời khuyên** — gợi ý giảng dạy được AI (OpenRouter) phân tích từ phân phối điểm thực tế

**Ghi chú:** Nếu không có ảnh thực, vẽ wireframe đơn giản với các vùng được đánh nhãn rõ ràng.

---

## Slide 17 — Demo: AI tạo đề thi

**Mục tiêu:** Cho người xem thấy luồng AI hoạt động trong UI.

**Bố cục:** 2–3 ảnh chụp màn hình tuần tự (dạng storyboard trái → phải).

**Bước 1** `[Screenshot: ExamModal — form nhập liệu]`
- Trường nhập: Tên bài học · Mô tả đề · Số câu hỏi
- Nút "AI sinh câu hỏi" màu indigo nổi bật

**Bước 2** `[Screenshot: Trạng thái loading]`
- Spinner + text "Đang sinh câu hỏi với AI (OpenRouter)..."

**Bước 3** `[Screenshot: Danh sách câu hỏi sau khi AI sinh]`
- Mỗi câu hỏi hiển thị 4 đáp án A/B/C/D
- Đáp án đúng được đánh dấu xanh
- Nút Sửa / Xóa từng câu
- Nút "Lưu đề thi" phía dưới

---

## Slide 18 — Demo: Giao diện học sinh

**Mục tiêu:** Cho người xem thấy trải nghiệm phía học sinh.

**Bố cục:** 3 ảnh chụp màn hình chia 3 cột dọc.

**Cột 1 — StudentHome** `[Screenshot: /student]`
- Danh sách đề thi được giao + deadline
- Bảng xếp hạng lớp
- Thông báo từ giáo viên

**Cột 2 — Làm bài** `[Screenshot: /student/exam/:id]`
- Câu hỏi hiển thị từng câu
- Đồng hồ đếm ngược thời gian
- Thanh tiến trình số câu đã làm

**Cột 3 — Kết quả** `[Screenshot: /exam-result/:id]`
- Điểm số + tổng câu đúng
- Chi tiết từng câu: đúng/sai + giải thích
- Nhận xét của giáo viên (nếu có)
- Biểu đồ tiến độ điểm theo thời gian

---

# PHẦN 6 — KẾT LUẬN (Slide 19–20)

---

## Slide 19 — Kết quả đạt được

**Mục tiêu:** Tổng kết những gì hệ thống đã hoàn thành.

**Bố cục:** 2 cột — trái: checklist kỹ thuật, phải: số liệu minh họa.

**Checklist (trái):**
- ✅ Hệ thống E-learning đầy đủ 2 vai trò (Teacher / Student)
- ✅ Kiến trúc 3 tầng: React SPA · Express REST API · MariaDB
- ✅ AI Chatbot giáo viên với 7 tool calls (OpenRouter)
- ✅ JWT stateless · bcryptjs password hashing
- ✅ Quản lý lớp, bài học, đề thi, phân công, chấm điểm
- ✅ Biểu đồ theo dõi tiến độ học sinh (chart.js)
- ✅ Import/Export Excel (SheetJS) · Export PDF (pdfkit)
- ✅ Responsive UI với Tailwind CSS 3

**Số liệu minh họa (phải):**

| Chỉ số | Giá trị |
|---|---|
| Bảng trong Database | 16 bảng |
| API endpoints | ~40 endpoints |
| Route modules (Express) | 11 modules |
| Frontend pages | 11 trang chính |
| AI tools (Teacher Chatbot) | 7 tools |
| Connection Pool | 10 kết nối |

---

## Slide 20 — Hướng phát triển & Q&A

**Mục tiêu:** Mở ra tương lai và kết thúc phần thuyết trình.

**Bố cục:** Trên: 2 cột hướng phát triển. Dưới: Q&A placeholder.

**Hướng phát triển ngắn hạn (trái — màu xanh lá):**
- Thông báo real-time (WebSocket / SSE)
- Email/SMS gửi kết quả cho phụ huynh
- Hỗ trợ câu hỏi tự luận (AI chấm điểm)
- Dark mode

**Hướng phát triển dài hạn (phải — màu indigo):**
- Ứng dụng di động (React Native)
- Phân tích học tập nâng cao bằng ML
- Multi-tenant (nhiều trường dùng chung)
- AI Chatbot mở rộng cho học sinh ôn tập

**Q&A (phần dưới — toàn chiều ngang, nền gradient):**
```
  Cảm ơn đã lắng nghe!
  Mọi câu hỏi xin mời đặt câu hỏi.
```

---

## Hướng dẫn bổ sung cho Agent

### Thứ tự ưu tiên nếu tool có giới hạn
1. **Bắt buộc có sơ đồ:** Slide 4 (kiến trúc tổng quan), Slide 5 (deployment), Slide 8 (ERD), Slide 12 (sequence tổng quát), Slide 15 (sequence AI)
2. **Nên có sơ đồ:** Slide 7 (luồng nghiệp vụ), Slide 14 (AI integration)
3. **Bảng và bullet là đủ:** Các slide còn lại

### Màu sắc nhất quán
- Giáo viên: **Indigo** `#4F46E5`
- Học sinh: **Xanh lá** `#10B981`
- AI / OpenRouter: **Tím** `#8B5CF6`
- Cảnh báo / Vấn đề: **Vàng** `#F59E0B`

### Yêu cầu tối thiểu mỗi slide
- Tiêu đề ≤ 8 từ
- ≤ 6 bullet point (dùng sơ đồ thay bullet khi có thể)
- Sơ đồ / hình ảnh ≥ 40% diện tích slide
- Số trang góc dưới phải
- Header phần (Phần 1, 2…) hiển thị nhỏ góc trên phải để người xem biết đang ở đâu
