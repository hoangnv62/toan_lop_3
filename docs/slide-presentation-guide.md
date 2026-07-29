# Hướng dẫn tạo Slide thuyết trình — E-Learning Toán lớp 3

> **Dành cho AI Agent:** Đặc tả **17 slide** thuyết trình cho dự án **Nền tảng E-learning Toán lớp 3**.
> Tinh thần chung: **mô tả dự án ở mức tổng quan** — hệ thống làm được gì, vận hành ra sao, mang lại giá trị gì.
> **Không** liệt kê chi tiết bảng dữ liệu, cấu hình, thư viện hay thông số kỹ thuật vụn vặt.
> Toàn bộ nội dung dưới đây đã được đối chiếu với mã nguồn thực tế — **không tự bịa thêm tính năng**.
> Đọc toàn bộ tài liệu trước khi bắt đầu.

---

## Yêu cầu xuất file

**Định dạng đầu ra** (ưu tiên theo thứ tự): Microsoft PowerPoint (.pptx) → Canva Presentation → Google Slides.

---

## Animation — Đặc tả bắt buộc

> Slide **phải có animation**. Mục tiêu: dẫn dắt ánh mắt người xem theo lời nói của người thuyết trình, không phải để trang trí.
> Nguyên tắc gốc: **một ý — một chuyển động**. Nếu bỏ animation đi mà slide vẫn hiểu được như cũ thì animation đó là thừa.

### 1. Chuyển cảnh giữa các slide (Transition)

| Thuộc tính | Giá trị |
|---|---|
| Hiệu ứng | **Fade** (Mờ dần) |
| Thời lượng | 0.6 giây |
| Áp dụng | Toàn bộ slide — dùng nút **Apply To All** |
| Chuyển slide | Khi bấm chuột (bỏ tick "After / Tự động sau") |

**Ngoại lệ có chủ đích:** chuyển từ Slide 8 → 9 và Slide 10 → 11 dùng **Morph** (Biến đổi) nếu công cụ hỗ trợ. Hai cặp này là "tóm tắt → sơ đồ đầy đủ", Morph tạo cảm giác phóng to vào chi tiết. Nếu công cụ không có Morph, dùng Fade như bình thường.

### 2. Bộ hiệu ứng xuất hiện được phép (Entrance)

Chỉ dùng **4 hiệu ứng** sau — không dùng bất kỳ hiệu ứng nào ngoài danh sách này:

| Hiệu ứng | Dùng cho | Thời lượng |
|---|---|---|
| **Fade** (Mờ dần) | Mặc định cho mọi thứ: chữ, ảnh, sơ đồ | 0.5s |
| **Float In / Up** (Trôi lên) | Card, box, khối nội dung lớn | 0.5s |
| **Wipe — From Left** (Quét từ trái) | Mũi tên, đường nối, thanh tiến trình, dòng thời gian | 0.4s |
| **Appear** (Hiện ngay) | Chỉ khi cần xuất hiện tức thì, không có độ trễ | — |

**Nhấn mạnh (Emphasis):** cho phép duy nhất **Pulse**, dùng **tối đa 1 lần trong cả bài** — đặt ở highlight box của Slide 13 (câu "AI không thay thế giáo viên").

### 3. Quy tắc thời gian (Timing)

- **Ý chính = 1 lần bấm chuột.** Người thuyết trình kiểm soát nhịp, slide không tự chạy.
- **Ý con trong cùng một nhóm** = `After Previous`, delay **0.2 giây**, nối tiếp nhau tự động.
- **Thành phần của sơ đồ** = `After Previous`, delay **0.3 giây** giữa các tầng.
- Không đặt delay > 0.5s — người xem sẽ tưởng slide bị treo.

### 4. Cấm tuyệt đối

- ❌ Âm thanh đi kèm hiệu ứng
- ❌ Hiệu ứng xoay, nảy, bay ngang màn hình, đánh chữ từng ký tự (Bounce, Spin, Fly In, Typewriter)
- ❌ Hiệu ứng thoát (Exit) — nội dung đã hiện thì để nguyên đến hết slide
- ❌ Animation trên số trang, tiêu đề phần, logo
- ❌ Quá **6 bước animation** trong một slide — nếu vượt, hãy gom ý lại thay vì tách nhỏ hơn

### 5. Chỉ định animation cho từng slide

| Slide | Thứ tự xuất hiện | Hiệu ứng · Trigger |
|---|---|---|
| 1 — Trang bìa | Tiêu đề → tiêu đề phụ → thông tin nhóm | Fade · After Previous 0.3s (tự chạy hết) |
| 2 — Mục lục | 6 mục lần lượt | Fade · After Previous 0.2s |
| 3 — Bối cảnh | Khối "Vấn đề" → khối "Giải pháp" | Float In Up · 2 lần click |
| 4 — Tính năng | Cột Giáo viên → cột Học sinh (mỗi cột: bullet nối tiếp) | Float In Up cho cột, Fade cho bullet · 2 lần click |
| 5 — Kiến trúc | **Theo tầng:** Giao diện → Máy chủ → CSDL → AI & Email → ghi chú dưới | Fade cho khối, Wipe From Left cho mũi tên · After Previous 0.3s |
| 6 — Luồng nghiệp vụ | Luồng Giáo viên (trái) → luồng Học sinh (phải) → điểm gặp "Đề thi" | Fade + Wipe cho mũi tên · 3 lần click |
| 7 — Công nghệ | 3 card → dải triển khai | Float In Up · After Previous 0.2s, dải cuối 1 click |
| 8 — Phân quyền | Sơ đồ use case → bảng so sánh (từng dòng) | Fade · 2 lần click |
| **9 — Use Case tổng thể** | **Cả ảnh, 1 bước duy nhất** | Fade 0.6s · With Previous (hiện ngay khi vào slide) |
| 10 — Mô hình dữ liệu | Sơ đồ → 5 nhãn nhóm → chú thích | Fade · After Previous 0.3s |
| **11 — CSDL tổng thể** | **Cả ảnh, 1 bước duy nhất** | Fade 0.6s · With Previous |
| 12 — Luồng làm bài | Từng bước của sequence diagram theo đúng thứ tự thời gian | Wipe From Left · After Previous 0.3s |
| 13 — Vai trò AI | Card "AI cùng giáo viên" → card "AI cùng học sinh" → highlight box | Float In Up · 3 lần click; highlight box thêm **Pulse** |
| 14 — Luồng trợ lý AI | Từng mắt xích của luồng | Wipe From Left · After Previous 0.3s |
| 15 — Demo giáo viên | Ảnh 1 + bullet → ảnh 2 + bullet | Fade · 2 lần click |
| 16 — Demo học sinh | 3 cột lần lượt trái → phải | Fade · 3 lần click |
| 17 — Kết luận | Cột kết quả → cột hướng phát triển → dải Q&A | Float In Up · 3 lần click |

> **Với 2 slide ảnh (9 và 11):** cố ý chỉ có **một** animation. Ảnh sơ đồ đầy đủ đã rất nhiều chi tiết — tách nhỏ animation sẽ khiến người xem mất phương hướng.

### 6. Tên hiệu ứng theo từng công cụ

| Ý đồ | PowerPoint | Google Slides | Canva |
|---|---|---|---|
| Mờ dần | Fade | Fade in | Fade |
| Trôi lên | Float In (Direction: Up) | Fly in from bottom | Rise |
| Quét từ trái | Wipe (From Left) | Wipe from left | Wipe |
| Hiện ngay | Appear | Appear | — (đặt thời lượng 0s) |
| Chuyển cảnh mờ | Fade (Transitions tab) | Dissolve | Dissolve |

**Kiểm tra trước khi nộp:** chạy thử Slide Show từ đầu đến cuối, bấm chuột đúng số lần ghi trong bảng ở mục 5. Nếu phải bấm thừa hoặc thiếu, animation đã bị đặt sai trigger.

---

## Quy ước chung

| Quy ước | Giá trị |
|---|---|
| Ngôn ngữ | Tiếng Việt (thuật ngữ kỹ thuật giữ nguyên tiếng Anh) |
| Font | Inter hoặc Be Vietnam Pro |
| Màu chủ đạo | Indigo `#4F46E5` — trắng — xám nhạt |
| Accent | Xanh lá `#10B981` (học sinh) · Tím `#8B5CF6` (AI) · Vàng `#F59E0B` (vấn đề) |
| Tổng số slide | **17 slide** |
| Số trang | Góc dưới phải mỗi slide |

**Yêu cầu tối thiểu mỗi slide:** tiêu đề ≤ 8 từ · ≤ 6 bullet · ưu tiên sơ đồ/hình ảnh thay cho chữ · tên phần hiển thị nhỏ ở góc trên phải.

---

# PHẦN 1 — GIỚI THIỆU (Slide 1–3)

## Slide 1 — Trang bìa

**Bố cục:** Toàn màn hình, nền gradient indigo → tím nhạt, chữ trắng.

- **Tiêu đề lớn:** Nền tảng E-Learning Toán lớp 3
- **Tiêu đề phụ:** Hệ thống quản lý lớp học & kiểm tra thông minh với AI
- **Logo:** Trường Đại học Xây dựng Hà Nội (góc trên trái)
- **Thông tin nhóm:** *(để trống — agent không tự điền)*
- **Năm:** 2025

---

## Slide 2 — Mục lục

**Bố cục:** 2 cột, số thứ tự màu indigo, mỗi phần một icon.

| # | Phần |
|---|---|
| 1 | Giới thiệu dự án 📌 |
| 2 | Tổng quan hệ thống 🏗️ |
| 3 | Thiết kế 🗂️ |
| 4 | Ứng dụng AI 🤖 |
| 5 | Demo 🖥️ |
| 6 | Kết luận 🎯 |

---

## Slide 3 — Bối cảnh & Giải pháp

**Bố cục:** Chia đôi ngang — trái: vấn đề (nền vàng nhạt), phải: giải pháp (nền xanh nhạt).

**Vấn đề:**
- Soạn đề kiểm tra thủ công tốn nhiều thời gian
- Khó theo dõi tiến độ học sinh theo thời gian thực
- Phụ huynh thiếu kênh cập nhật thông tin từ lớp học

**Giải pháp:**
- Số hóa toàn bộ quy trình dạy – học – kiểm tra
- AI hỗ trợ giáo viên soạn đề, phân tích kết quả và đồng hành cùng học sinh
- Thông báo lớp học tự động gửi email tới người thân của học sinh

**Đối tượng sử dụng:** Giáo viên · Học sinh lớp 3 *(người thân nhận thông báo qua email, không cần tài khoản)*

---

# PHẦN 2 — TỔNG QUAN HỆ THỐNG (Slide 4–7)

## Slide 4 — Tính năng chính

**Mục tiêu:** Người xem nắm được hệ thống làm được gì chỉ trong một slide.

**Bố cục:** 2 cột — trái Giáo viên (indigo), phải Học sinh (xanh lá).

**Giáo viên:**
- Quản lý lớp học, bài học, danh sách học sinh (thêm tay hoặc import Excel)
- Ngân hàng câu hỏi dùng chung, soạn đề và giao đề theo lớp kèm hạn nộp
- Theo dõi kết quả, nhận xét từng bài làm, xuất Excel kết quả và PDF đề thi
- Gửi thông báo lớp — hệ thống tự động email tới người thân học sinh
- Trợ lý AI hỗ trợ soạn đề, tra cứu và thao tác trực tiếp trên hệ thống

**Học sinh:**
- Xem đề được giao, thời gian mở đề và hạn nộp
- Làm bài trực tuyến có đếm ngược thời gian
- Xem điểm, đáp án đúng/sai kèm giải thích và nhận xét của giáo viên
- Theo dõi biểu đồ tiến độ, bảng xếp hạng lớp, thông báo từ giáo viên
- Quản lý danh sách người thân nhận thông báo
- Trợ lý AI giải đáp thắc mắc Toán lớp 3

---

## Slide 5 — Kiến trúc tổng quan

**Mục tiêu:** Toàn cảnh hệ thống ở mức khối chức năng.

**Bố cục:** Sơ đồ chiếm phần lớn slide, ghi chú ngắn phía dưới.

> 📷 **[ CHÈN ẢNH: Sơ đồ kiến trúc — Giao diện web · Máy chủ ứng dụng · Cơ sở dữ liệu · Dịch vụ AI · Dịch vụ email ]**
> Căn giữa · Chiều rộng ~80% slide · Nền trắng hoặc trong suốt

**Ghi chú (dưới sơ đồ, mỗi ý một dòng ngắn):**
- Giao diện web và máy chủ chạy độc lập, giao tiếp qua REST API
- Cơ sở dữ liệu lưu lớp học, đề thi, bài làm và lịch sử trò chuyện với AI
- AI và email là dịch vụ bên ngoài — hệ thống vẫn hoạt động bình thường khi chúng gặp sự cố
- **Hệ thống đã được triển khai thực tế trên Internet**, không chỉ chạy trên máy cá nhân

---

## Slide 6 — Luồng nghiệp vụ chính

**Mục tiêu:** Cho thấy hệ thống vận hành theo 2 luồng song song và gặp nhau ở "Đề thi".

**Bố cục:** Sơ đồ toàn slide — Giáo viên bên trái, Học sinh bên phải.

> 📷 **[ CHÈN ẢNH: Luồng nghiệp vụ song song — Tạo bài học → Soạn đề → Giao đề cho lớp → Học sinh làm bài → Chấm điểm tự động → Nhận xét & Thống kê ]**
> Căn giữa · Chiều rộng ~90% slide

---

## Slide 7 — Công nghệ & Triển khai

**Mục tiêu:** Giới thiệu stack ở mức tên công nghệ, **không** đi vào cấu hình hay thư viện phụ.

**Bố cục:** 3 card ngang + 1 dòng triển khai phía dưới.

| Giao diện | Máy chủ & Dữ liệu | AI & Tích hợp |
|---|---|---|
| React + Vite | Node.js + Express | OpenRouter AI |
| Biểu đồ thống kê | MariaDB / MySQL | Trò chuyện phản hồi theo thời gian thực |

**Triển khai (dải dưới 3 card):**
> Giao diện chạy trên **Vercel**, máy chủ và cơ sở dữ liệu chạy trên **Railway** — hệ thống đang hoạt động trực tuyến.
> Toàn bộ stack là **open-source**, chi phí triển khai thấp.

---

# PHẦN 3 — THIẾT KẾ (Slide 8–12)

## Slide 8 — Phân quyền & Use Case

**Mục tiêu:** Làm rõ hai vai trò và ranh giới quyền hạn.

**Bố cục:** Sơ đồ Use Case bên trái (~55%), bảng so sánh quyền bên phải.

> 📷 **[ CHÈN ẢNH: Use Case Diagram — 2 actor Giáo viên & Học sinh ]**
> Có thể lấy từ `docs/use-case-diagram.md` (sơ đồ PlantUML đã có sẵn trong dự án)

| Chức năng | GV | HS |
|---|:---:|:---:|
| Quản lý lớp, bài học, đề thi | ✅ | ❌ |
| Ngân hàng câu hỏi | ✅ | ❌ |
| Làm bài kiểm tra | ❌ | ✅ |
| Xem kết quả & tiến độ cá nhân | ❌ | ✅ |
| Thống kê lớp & xuất báo cáo | ✅ | ❌ |
| Trợ lý AI | ✅ *(soạn đề, quản lý)* | ✅ *(hỏi đáp)* |

> ⚠️ Lưu ý cho agent: **cả hai vai trò đều có trợ lý AI**, chỉ khác phạm vi — đừng vẽ AI là đặc quyền của giáo viên.

---

## Slide 9 — Sơ đồ Use Case tổng thể

**Mục tiêu:** Trình bày đầy đủ toàn bộ use case của hệ thống — slide này để người xem thấy quy mô chức năng, không cần đọc hết từng ô.

**Bố cục:** **Ảnh chiếm toàn slide (full-bleed)** — chỉ có tiêu đề nhỏ ở góc trên trái, không bullet, không chú thích dài.

> 🖼️ **[ CHÈN ẢNH: Sơ đồ Use Case tổng thể — nhóm cung cấp ]**
> Căn giữa · Chiều rộng ~95% slide, chiều cao tối đa trong lề · Nền trắng
> Giữ đúng tỉ lệ ảnh gốc, **không kéo giãn méo hình**

**Yêu cầu trình bày:**
- Tiêu đề slide: "Sơ đồ Use Case tổng thể" — cỡ chữ nhỏ, đặt góc trên trái để nhường tối đa diện tích cho ảnh
- Nếu ảnh quá chi tiết để đọc trên màn chiếu: thêm một dòng nhỏ dưới cùng — *"Chi tiết đầy đủ xem trong báo cáo"*
- Animation: chỉ Fade In một lần cho cả ảnh, không tách phần

**Nguồn ảnh:** Dự án đã có sẵn mã nguồn PlantUML tại `docs/use-case-diagram.md` — render tại https://www.plantuml.com/plantuml/uml/ rồi xuất PNG/SVG.

---

## Slide 10 — Mô hình dữ liệu

**Mục tiêu:** Cho thấy các nhóm dữ liệu chính và mối liên hệ — **không** liệt kê cột của từng bảng.

**Bố cục:** Sơ đồ ERD rút gọn chiếm toàn slide, một dòng chú thích phía dưới.

> 📷 **[ CHÈN ẢNH: ERD rút gọn theo 5 nhóm ]**
> Căn giữa · Chiều rộng ~90% slide

**5 nhóm dữ liệu (dùng làm nhãn cho các cụm trong sơ đồ):**
1. Người dùng, lớp học và người thân
2. Bài học, đề thi, câu hỏi và đáp án
3. Ngân hàng câu hỏi
4. Bài làm, điểm số và nhận xét của giáo viên
5. Thông báo lớp học và lịch sử trò chuyện với AI

**Chú thích:** Mỗi bài làm lưu chi tiết **từng câu trả lời** — nhờ đó hệ thống chấm điểm tự động và phân tích được học sinh sai ở đâu.

---

## Slide 11 — Sơ đồ cơ sở dữ liệu tổng thể

**Mục tiêu:** Trình bày đầy đủ 16 bảng và quan hệ giữa chúng — slide này cho thấy mức độ hoàn chỉnh của thiết kế dữ liệu.

**Bố cục:** **Ảnh chiếm toàn slide (full-bleed)** — chỉ có tiêu đề nhỏ ở góc trên trái, không bullet.

> 🖼️ **[ CHÈN ẢNH: Sơ đồ ERD tổng thể 16 bảng — nhóm cung cấp ]**
> Căn giữa · Chiều rộng ~95% slide, chiều cao tối đa trong lề · Nền trắng
> Giữ đúng tỉ lệ ảnh gốc, **không kéo giãn méo hình**

**Yêu cầu trình bày:**
- Tiêu đề slide: "Sơ đồ cơ sở dữ liệu tổng thể" — cỡ chữ nhỏ, góc trên trái
- Một dòng nhỏ dưới cùng: *"16 bảng · Chi tiết đầy đủ xem trong báo cáo"*
- Animation: chỉ Fade In một lần cho cả ảnh
- Slide này **thay thế** nhu cầu liệt kê tên bảng ở các slide khác — không nhắc lại tên bảng ở đâu nữa

**Nguồn ảnh:** Cấu trúc bảng nằm trong `backend/database/schema.js`. Có thể sinh sơ đồ bằng công cụ reverse-engineering (MySQL Workbench, dbdiagram.io, DBeaver) hoặc vẽ tay từ file này.

---

## Slide 12 — Luồng làm bài kiểm tra

**Mục tiêu:** Một sơ đồ tuần tự bao quát từ lúc học sinh mở đề đến khi xem kết quả.

**Bố cục:** Sequence diagram chiếm toàn slide.

> 📷 **[ CHÈN ẢNH: Sequence Diagram — Học sinh → Giao diện → Máy chủ → Cơ sở dữ liệu ]**
> Các bước: mở đề (kiểm tra thời gian mở & hạn nộp) → làm bài có đếm ngược → nộp bài → chấm điểm tự động → xem kết quả kèm giải thích
> Căn giữa · Chiều rộng ~90% slide

---

# PHẦN 4 — ỨNG DỤNG AI (Slide 13–14)

## Slide 13 — Vai trò của AI

**Mục tiêu:** AI xuất hiện ở đâu trong hệ thống và giới hạn ở đâu.

**Bố cục:** 2 card ngang + 1 highlight box phía dưới.

**AI đồng hành cùng giáo viên:**
- Sinh câu hỏi trắc nghiệm theo bài học và số lượng yêu cầu
- Nhận xét chất lượng đề thi, phân tích kết quả lớp sau mỗi bài kiểm tra
- Gợi ý phương pháp giảng dạy dựa trên phân phối điểm thực tế
- Trợ lý hội thoại **thao tác được trên hệ thống**: tra cứu lớp/bài học/ngân hàng câu hỏi, tạo và cập nhật đề, giao hoặc hủy giao đề, gửi thông báo

**AI đồng hành cùng học sinh:**
- Trợ lý hỏi đáp Toán lớp 3, trả lời bằng ngôn ngữ phù hợp lứa tuổi
- Chỉ tư vấn kiến thức — không truy cập hay thay đổi dữ liệu lớp học
- Lịch sử trò chuyện được lưu lại, học sinh quay lại vẫn xem được

**Highlight box:**
> AI **không thay thế** giáo viên. Mọi nội dung do AI sinh ra đều được giáo viên xem lại và phê duyệt trước khi đưa vào đề thi.
> Khi dịch vụ AI quá tải, hệ thống tự động thử lại và chuyển sang mô hình dự phòng để trải nghiệm không bị gián đoạn.

---

## Slide 14 — Luồng trợ lý AI của giáo viên

**Mục tiêu:** Cho thấy điểm đặc biệt nhất của dự án — AI không chỉ trả lời, mà còn thực hiện thao tác thay giáo viên.

**Bố cục:** Sơ đồ tuần tự / luồng dữ liệu chiếm toàn slide.

> 📷 **[ CHÈN ẢNH: Luồng trợ lý AI — Giáo viên đặt yêu cầu → AI xác định việc cần làm → Hệ thống truy vấn/ghi dữ liệu → AI tổng hợp → Giáo viên xem và duyệt ]**
> Căn giữa · Chiều rộng ~90% slide

**Hai dòng nhấn mạnh dưới sơ đồ:**
- AI tự quyết định cần tra cứu hay thao tác gì dựa trên câu nói của giáo viên
- Câu hỏi do AI sinh ra chỉ được lưu sau khi giáo viên xác nhận

---

# PHẦN 5 — DEMO (Slide 15–16)

## Slide 15 — Demo: Phía giáo viên

**Bố cục:** 2 ảnh chụp màn hình + bullet ngắn bên cạnh.

**Ảnh 1 — Dashboard** `[Screenshot: /dashboard]`
- Tổng quan số lớp, học sinh, đề thi
- Biểu đồ điểm trung bình theo lớp
- Khung gợi ý giảng dạy từ AI

**Ảnh 2 — Soạn đề & Trợ lý AI** `[Screenshot: màn hình tạo đề hoặc cửa sổ chat trợ lý]`
- Nhập bài học, mô tả, số câu hỏi → AI sinh câu hỏi
- Có thể chọn câu hỏi từ ngân hàng hoặc import Excel
- Giáo viên sửa / xóa từng câu trước khi lưu

**Ghi chú:** Nếu không có ảnh thực, vẽ wireframe đơn giản có nhãn rõ ràng.

---

## Slide 16 — Demo: Phía học sinh

**Bố cục:** 3 ảnh chụp màn hình chia 3 cột dọc.

**Trang chủ** `[Screenshot: /student]`
- Danh sách đề được giao + hạn nộp
- Bảng xếp hạng lớp, thông báo từ giáo viên, danh sách người thân

**Làm bài** `[Screenshot: /student/exam/:id]`
- Đồng hồ đếm ngược, thanh tiến trình số câu đã làm

**Kết quả** `[Screenshot: /exam-result/:id]`
- Điểm số, đáp án đúng/sai kèm giải thích
- Nhận xét giáo viên, biểu đồ tiến độ theo thời gian

---

# PHẦN 6 — KẾT LUẬN (Slide 17)

## Slide 17 — Kết quả, hướng phát triển & Q&A

**Bố cục:** Trên: 2 cột (kết quả · hướng phát triển). Dưới: dải Q&A nền gradient.

**Kết quả đạt được:**
- ✅ Nền tảng hoàn chỉnh cho 2 vai trò Giáo viên và Học sinh, **đã triển khai trực tuyến**
- ✅ Quản lý lớp học, bài học, ngân hàng câu hỏi, đề thi và chấm điểm tự động
- ✅ Trợ lý AI cho cả giáo viên và học sinh; AI hỗ trợ soạn đề và phân tích kết quả
- ✅ Thống kê, biểu đồ tiến độ, xuất Excel/PDF và email thông báo tới người thân

**Hướng phát triển:**
- Hỗ trợ câu hỏi tự luận và chấm điểm tự động phần tự luận
- Thông báo real-time ngay trong ứng dụng
- Cổng đăng nhập riêng cho phụ huynh
- Ứng dụng di động
- Bổ sung kiểm thử tự động và giám sát hệ thống

**Q&A (dải dưới, toàn chiều ngang):**
```
  Cảm ơn đã lắng nghe!
  Rất mong nhận được câu hỏi từ quý thầy cô.
```

---

## Ghi chú cho Agent

**Slide bắt buộc có sơ đồ:** 5 (kiến trúc), 6 (luồng nghiệp vụ), 8 (use case tổng quan), 10 (nhóm dữ liệu), 12 (luồng làm bài), 14 (luồng trợ lý AI).

**Slide chỉ có ảnh (full-bleed, nhóm tự cung cấp ảnh):** 9 (Use Case tổng thể), 11 (Cơ sở dữ liệu tổng thể).
Hai slide này cố ý **không có bullet** — chúng đi ngay sau slide tóm tắt tương ứng (8 và 10) để người xem đã nắm ý chính rồi mới nhìn bản đầy đủ. Nếu chưa có ảnh, để khung placeholder đúng kích thước thay vì bỏ slide.

**Màu sắc nhất quán:** Giáo viên `#4F46E5` · Học sinh `#10B981` · AI `#8B5CF6` · Vấn đề `#F59E0B`.

**Nguyên tắc nội dung:** nói về **giá trị và cách vận hành**, không về cấu hình kỹ thuật. Nếu một chi tiết chỉ có ý nghĩa với lập trình viên (tên bảng, tên thư viện, thông số kết nối), hãy bỏ đi hoặc diễn đạt lại bằng ngôn ngữ nghiệp vụ.

### Số liệu thực tế (đã kiểm chứng từ mã nguồn — chỉ dùng khi cần, đừng bịa thêm)

| Chỉ số | Giá trị |
|---|---|
| Bảng trong cơ sở dữ liệu | 16 |
| API endpoints | 67 (11 nhóm chức năng) |
| Trang giao diện | 11 |
| Thao tác trợ lý AI của giáo viên thực hiện được | 13 |
| Vai trò người dùng | 2 (giáo viên, học sinh) |

### Những điểm dễ mô tả sai — cần tránh

- ❌ "Chỉ giáo viên mới có AI" → **sai**, học sinh cũng có trợ lý AI riêng
- ❌ "Gửi email cho phụ huynh là hướng phát triển tương lai" → **sai**, tính năng này đã chạy
- ❌ "Hệ thống mới chỉ chạy trên localhost" → **sai**, đã triển khai trực tuyến
- ❌ Nêu tên bảng dữ liệu, tên thư viện phụ, thông số kết nối trên slide
