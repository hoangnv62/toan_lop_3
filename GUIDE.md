# Hướng dẫn sử dụng Claude AI Agent

> Tài liệu này giải thích cách làm việc hiệu quả với Claude để thêm tính năng mới, fix bug, và sử dụng các command có sẵn.

---

## Bắt đầu nhanh (30 giây)

**Bước 1** — Điền tech stack vào `rules/tech-stack.md`  
**Bước 2** — Mô tả điều bạn muốn làm  
**Bước 3** — Claude sẽ hỏi lại nếu cần thêm thông tin, rồi bắt tay vào làm

---

## Quy trình chuẩn cho tính năng mới

```
/spec → /plan → /build → /test → /review → /deploy
```

Không cần dùng đủ 6 bước mỗi lần — chọn theo độ phức tạp:

| Tính năng | Nên dùng |
|-----------|---------|
| Nhỏ (< 1 ngày) | `/build` thẳng, hoặc chỉ mô tả thông thường |
| Trung bình (1–3 ngày) | `/plan` → `/build` → `/review` |
| Lớn / phức tạp | `/spec` → `/plan` → `/build` → `/test` → `/review` |

---

## Thêm tính năng mới

### Cách mô tả tốt

Cung cấp đủ 3 yếu tố: **AI muốn làm gì**, **điều kiện / ràng buộc**, **kết quả mong đợi**.

**Mẫu prompt:**
```
Tôi muốn thêm [tính năng]. 
Yêu cầu: [điều kiện cụ thể].
Kết quả mong đợi: [user sẽ thấy/làm được gì].
```

### Ví dụ thực tế

**Thêm tính năng đơn giản:**
```
Thêm API endpoint GET /api/v1/products?category=&page=&limit= 
để lấy danh sách sản phẩm có phân trang. 
Trả về: id, name, price, category, createdAt.
Sắp xếp theo createdAt desc mặc định.
```

**Thêm tính năng có business logic:**
```
Thêm tính năng đặt hàng. Khi user POST /api/v1/orders:
- Kiểm tra stock còn đủ không (nếu không đủ trả 409)
- Trừ stock trong cùng 1 transaction
- Gửi email xác nhận (queue, không cần chờ)
- Trả về order đã tạo với trạng thái "pending"
```

**Thêm UI component:**
```
Tạo component TaskList hiển thị danh sách công việc.
Mỗi task có: checkbox (đánh dấu done), tiêu đề, ngày tạo, nút xóa.
Loading state: skeleton 3 hàng.
Empty state: "Chưa có công việc nào. Tạo mới ngay!"
Error state: thông báo lỗi + nút thử lại.
```

**Thêm tính năng fullstack:**
```
Tôi muốn thêm tính năng "bình luận" cho bài viết.
Backend: 
  - GET /api/v1/posts/:id/comments (phân trang cursor-based)
  - POST /api/v1/posts/:id/comments (yêu cầu đăng nhập)
  - DELETE /api/v1/comments/:id (chỉ owner hoặc admin)
Frontend:
  - Hiển thị danh sách comment bên dưới bài viết
  - Form thêm comment (real-time, không reload trang)
  - Nút xóa chỉ hiện với comment của mình
```

### Dùng command `/spec` cho tính năng lớn

```
/spec Hệ thống thanh toán với Stripe
```

Claude sẽ tạo ra một PRD với:
- Mục tiêu và phạm vi
- User stories
- API contracts
- Edge cases và điều kiện lỗi

---

## Fix Bug

### Cách mô tả bug hiệu quả

Cung cấp đủ: **triệu chứng**, **bước tái hiện**, **kết quả thực tế vs mong đợi**.

**Mẫu prompt:**
```
Bug: [mô tả ngắn]
Bước tái hiện: [1. ... 2. ... 3. ...]
Kết quả thực tế: [điều gì đang xảy ra]
Kết quả mong đợi: [điều gì nên xảy ra]
File liên quan: [nếu biết]
```

### Ví dụ thực tế

**Bug với error message rõ ràng:**
```
/fix-issue API GET /api/v1/users trả về lỗi 500 khi không có query param nào.
Error: "Cannot read properties of undefined (reading 'page')"
File: src/controllers/user.controller.ts
```

**Bug UI:**
```
/fix-issue Button "Lưu" trong form chỉnh sửa profile bị disable mãi không bật lên
ngay cả khi đã thay đổi thông tin. Chỉ xảy ra trên Firefox, Chrome thì ổn.
Component: src/features/profile/components/ProfileForm.tsx
```

**Bug logic:**
```
/fix-issue Tính năng giảm giá áp dụng sai:
- Giảm giá 10% cho đơn > 500k
- Thực tế: đơn 499k cũng được giảm
- Kết quả mong đợi: chỉ đơn >= 500k mới giảm
File: src/domain/services/order.service.ts, hàm calculateDiscount()
```

**Bug không rõ nguyên nhân:**
```
/debug Thỉnh thoảng (khoảng 1/10 lần) API tạo đơn hàng bị lỗi 500
nhưng log không có gì bất thường. Xảy ra nhiều hơn vào giờ cao điểm.
```

### Dùng command `/debug` khi không biết nguyên nhân

```
/debug User báo cáo không đăng nhập được nhưng không có error trong log.
Endpoint: POST /api/v1/auth/login
```

Claude sẽ phân tích có hệ thống: kiểm tra input validation → auth logic → DB queries → middleware → logs.

---

## Command Reference

### `/spec` — Định nghĩa tính năng
**Dùng khi:** Tính năng phức tạp, cần làm rõ yêu cầu trước khi code.

```
/spec Tính năng đăng nhập với Google OAuth
/spec Hệ thống thông báo real-time
/spec Trang dashboard với charts thống kê doanh thu
```

**Output:** File `SPEC.md` với user stories, API contracts, acceptance criteria.

---

### `/plan` — Lên kế hoạch thực hiện
**Dùng khi:** Đã có spec, muốn chia nhỏ thành tasks trước khi code.

```
/plan  (chạy sau khi đã có SPEC.md)
/plan Thêm chức năng upload avatar, chia nhỏ theo vertical slice
```

**Output:** File `tasks/plan.md` và `tasks/todo.md` với danh sách tasks có thứ tự ưu tiên.

---

### `/build` — Implement tính năng
**Dùng khi:** Muốn Claude viết code trực tiếp.

```
/build Task 1: Tạo endpoint POST /api/v1/users
/build Implement UserService.findByEmail() theo plan đã có
/build Tạo component LoginForm theo spec
```

**Claude sẽ:** Viết code → viết test → giải thích những gì đã làm.

---

### `/test` — Viết và kiểm tra tests
**Dùng khi:** Muốn tập trung vào testing sau khi code xong, hoặc viết test trước (TDD).

```
/test Viết unit tests cho OrderService
/test Viết E2E test cho flow đăng ký tài khoản
/test Kiểm tra coverage hiện tại còn thiếu ở đâu
```

---

### `/review` — Review code
**Dùng khi:** Trước khi merge PR, hoặc muốn second opinion.

```
/review  (review toàn bộ thay đổi hiện tại)
/review src/services/payment.service.ts
/review Tập trung vào security và performance
```

**Claude sẽ kiểm tra:** Correctness → Readability → Architecture → Security → Performance.

---

### `/debug` — Phân tích lỗi có hệ thống
**Dùng khi:** Bug không rõ nguyên nhân, khó tái hiện.

```
/debug Memory usage tăng dần theo thời gian, restart mới hết
/debug Request thỉnh thoảng timeout ở production nhưng dev thì ổn
```

---

### `/fix-issue` — Fix bug cụ thể
**Dùng khi:** Đã biết bug là gì, muốn Claude sửa.

```
/fix-issue Validation email không chấp nhận ký tự + như user+tag@email.com
/fix-issue Form reset sau khi submit nhưng lỗi validation vẫn hiển thị
```

---

### `/simplify` — Đơn giản hóa code
**Dùng khi:** Code đang quá phức tạp, khó đọc.

```
/simplify src/services/order.service.ts
/simplify Hàm calculateShipping quá nhiều if-else, refactor lại
```

---

### `/deploy` — Deploy
**Dùng khi:** Sẵn sàng release.

```
/deploy staging
/deploy production v1.2.0
```

---

## Làm việc với Agents chuyên biệt

Thay vì nhờ Claude làm tất cả, bạn có thể gọi đúng agent cho từng việc:

### Khi nào gọi agent nào

| Bạn muốn... | Gọi agent |
|------------|----------|
| Thiết kế database schema | 🔧 **Backend Developer** |
| Tạo REST API endpoint | 🔧 **Backend Developer** |
| Setup queue / background job | 🔧 **Backend Developer** |
| Tạo UI component | 🖥️ **Frontend Developer** |
| Thiết kế hệ thống tổng thể | 🏗️ **Systems Architect** |
| Review code trước merge | 👀 **Code Reviewer** |
| Viết test strategy | 🧪 **Test Engineer** |
| Kiểm tra security | 🔒 **Security Auditor** |
| Thiết kế giao diện / UX flow | 🎨 **UI/UX Designer** |
| Viết nội dung / SEO | ✍️ **Copywriter/SEO** |
| Lên sprint plan | 📋 **Project Manager** |

### Ví dụ cách gọi agent

```
[Backend Developer] Tôi cần thiết kế schema cho hệ thống 
e-commerce với products, orders, users, và reviews.
Ưu tiên: query performance cho trang listing sản phẩm.

[Security Auditor] Review toàn bộ flow authentication 
của dự án này — đặc biệt là refresh token và session management.

[Systems Architect] Tôi đang có 10k users/ngày, dự kiến 
scale lên 500k trong 6 tháng. Kiến trúc hiện tại có vấn đề gì không?
```

---

## Tips để nhận được kết quả tốt hơn

### Cung cấp context đủ
```
❌ "Fix lỗi login"

✅ "API login trả về 401 dù password đúng. Tôi đang dùng bcrypt.compare().
   Gần đây vừa migrate từ md5 sang bcrypt nhưng chưa rehash password cũ."
```

### Chỉ rõ file và function khi biết
```
❌ "Sửa hàm tính giá"

✅ "Sửa hàm calculateTotal() trong src/services/cart.service.ts —
   đang tính sai khi có combo discount + coupon cùng lúc"
```

### Đặt giới hạn rõ ràng
```
"Chỉ sửa bug này, đừng refactor phần khác"
"Viết test nhưng chưa cần implement — để tôi làm sau"
"Tạo endpoint nhưng chưa cần viết migration — DB đã có sẵn"
```

### Yêu cầu giải thích khi không hiểu
```
"Giải thích tại sao lại dùng cursor-based pagination thay vì offset"
"Tại sao lại cần transaction ở đây? Không dùng có sao không?"
```

### Lặp lại nếu chưa đúng ý
```
"Gần đúng rồi nhưng tôi muốn loading state dạng skeleton 
thay vì spinner. Sửa lại giúp tôi."

"API response trả về snake_case nhưng frontend cần camelCase.
Thêm transform layer ở bước nào hợp lý nhất?"
```

---

## Ví dụ session làm việc thực tế

### Session 1: Thêm tính năng hoàn chỉnh

```
Bạn: /spec Tính năng wishlist — user có thể lưu sản phẩm yêu thích

Claude: [tạo SPEC.md với user stories và API contracts]

Bạn: /plan

Claude: [tạo tasks/plan.md với 5 tasks theo thứ tự]

Bạn: /build Task 1 — tạo bảng wishlists trong DB và repository

Claude: [viết migration + repository code + unit tests]

Bạn: Xem lại đi, tôi muốn dùng composite primary key (user_id, product_id) 
      thay vì id riêng

Claude: [cập nhật schema và repository]

Bạn: /build Task 2 — tạo WishlistService và 3 endpoints

Claude: [viết service + routes + controller + integration tests]

Bạn: /review

Claude: [review 5 trục, phát hiện thiếu rate limiting trên endpoint thêm]

Bạn: Fix issue mà review vừa tìm thấy

Claude: [thêm rate limiting]
```

### Session 2: Fix bug nhanh

```
Bạn: /fix-issue Phân trang trả về sai totalPages khi filter theo category.
     Ví dụ: có 47 sản phẩm category "phones", limit=10 nhưng totalPages=5 
     thay vì 5 (đúng là ceil(47/10) = 5... à ý tôi là 100 sản phẩm tổng 
     nhưng chỉ 47 thuộc category đó, lại đang đếm total toàn bộ bảng).
     File: src/repositories/product.repository.ts

Claude: [tìm bug trong COUNT query, sửa để WHERE clause được áp dụng trước khi COUNT]

Bạn: Viết regression test luôn đi

Claude: [viết integration test cover case này]
```
