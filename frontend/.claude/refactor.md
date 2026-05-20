# Hướng Dẫn Refactor Toàn Bộ UI Bằng Claude AI

## Mục tiêu

Refactor toàn bộ giao diện frontend hiện tại sang phong cách thiết kế của một website tham chiếu hiện đại nhưng:

- Giữ nguyên business logic
- Giữ nguyên API
- Giữ nguyên routing
- Chỉ thay đổi UI/UX
- Tối ưu responsive
- Tối ưu trải nghiệm người dùng
- Tạo design system đồng nhất

---

# Công Nghệ Hiện Tại

Dự án hiện tại sử dụng:

- ReactJS
- React Router
- Axios
- JavaScript
- Tailwind

---

# Yêu Cầu Refactor

## Giữ Nguyên

KHÔNG thay đổi:
- Logic nghiệp vụ
- API calls
- Endpoint
- Authentication flow
- Routing
- State management hiện có (nếu không cần thiết)

---

# Phong Cách Thiết Kế Mong Muốn

Refactor UI theo phong cách của:

Ví dụ:
- Linear
- Notion
- Stripe
- Vercel
- Duolingo
- Tailwind UI
- Material Design hiện đại

Mục tiêu:
- Modern SaaS UI
- Clean UI
- Minimal
- Chuyên nghiệp
- Responsive
- Mượt mà

---

# Các Yêu Cầu UI/UX

## Typography
- Font hiện đại
- Hierarchy rõ ràng
- Khoảng cách hợp lý
- Dễ đọc

## Layout
- Sử dụng spacing đồng nhất
- Grid layout rõ ràng
- Responsive cho desktop

## Components
Tạo reusable components cho:
- Button
- Input
- Modal
- Card
- Table
- Sidebar
- Navbar
- Dropdown
- Tabs
- Pagination

## Hiệu Ứng
- Hover effects
- Smooth transition
- Animation nhẹ
- Loading skeleton
- Empty state đẹp hơn

## Màu Sắc
- Đồng bộ màu sắc
- Modern palette
- Contrast tốt
- Dark/light friendly

---

# Design System

Tạo design system trước khi refactor:

## Spacing Scale
Ví dụ:
- 4px
- 8px
- 12px
- 16px
- 24px
- 32px

## Border Radius
Ví dụ:
- rounded-lg
- rounded-xl
- rounded-2xl

## Shadow
Sử dụng shadow nhẹ, hiện đại.

## Typography Scale
Ví dụ:
- text-sm
- text-base
- text-lg
- text-xl
- text-2xl

---

# Cấu Trúc Mong Muốn

Ví dụ:

src/
├── components/
├── layouts/
├── pages/
├── hooks/
├── services/
├── constants/
├── utils/
├── styles/

---

# Quy Tắc Refactor

## Ưu Tiên

1. Code sạch
2. Component tái sử dụng
3. Responsive
4. Dễ maintain
5. Tối ưu UX

---

# Không Được

- Không đổi tên API
- Không phá vỡ logic cũ
- Không hardcode dữ liệu
- Không duplicate CSS
- Không tạo component quá lớn

---

# Quy Trình Làm Việc

## Bước 1
Phân tích UI hiện tại:
- Điểm yếu
- UI inconsistency
- UX problems
- Layout issues

## Bước 2
Tạo design system chung.

## Bước 3
Refactor từng page:
- Login
- Dashboard
- Course page
- Exam page
- Class page
- Student management
- Teacher management

## Bước 4
Refactor shared components.

## Bước 5
Tối ưu responsive.

## Bước 6
Tối ưu animation và interaction.

---

# Output Mong Muốn

Mỗi lần refactor:
- Giải thích thay đổi
- Code hoàn chỉnh
- Component structure
- CSS/Tailwind mới
- Responsive behavior

---

# Coding Style

- React functional component
- Hooks only
- Clean JSX
- Tách component hợp lý
- Tránh prop drilling nếu không cần thiết
- Ưu tiên readability

---

# Responsive Requirements

## Desktop
- Tận dụng không gian tốt
- Dashboard hiện đại

---

# Accessibility

- aria-label
- keyboard navigation
- focus state rõ ràng
- contrast phù hợp

---

# Performance

- Hạn chế re-render
- Lazy load nếu cần
- Tối ưu component tree

---

# Kết Quả Mong Muốn

UI cuối cùng cần:
- Hiện đại
- Chuyên nghiệp
- Đồng bộ
- Dễ sử dụng
- Giống sản phẩm SaaS thực tế
- Có cảm giác production-ready