# RULE.md — Frontend UI Rules

> Áp dụng cho mọi thay đổi UI trong dự án này.  
> Claude phải đọc và tuân thủ file này trước khi chỉnh sửa bất kỳ file frontend nào.

---

## 1. Design Style

Phong cách: **Modern SaaS** — tham chiếu Linear, Vercel, Stripe, Notion.

- Clean, minimal, professional
- Không dùng gradient loè loẹt (trừ chart)
- Không dùng emoji trong UI component (chỉ dùng icon từ `react-icons/fi`)
- Spacing đồng nhất theo Tailwind scale

---

## 2. Font

```
Font: Inter (Google Fonts)
```

Đã load trong `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
```

Tailwind config đã khai báo:
```js
fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] }
```

---

## 3. Màu sắc (Color Tokens)

| Token | Hex | Dùng cho |
|---|---|---|
| `indigo-50` | `#EEF2FF` | Background nhẹ |
| `indigo-100` | `#E0E7FF` | Border active |
| `indigo-200` | `#C7D2FE` | — |
| `indigo-500` | `#6366F1` | Progress bar |
| `indigo-600` | `#4F46E5` | Button, active, accent |
| `indigo-700` | `#4338CA` | Hover button |
| `indigo-800` | `#3730A3` | Active press |

Màu bổ trợ dùng Tailwind mặc định:
- Success: `emerald-400 / emerald-600`
- Warning: `amber-400 / amber-600`
- Danger: `red-400 / red-600`
- Neutral: `gray-50 / gray-100 / gray-200 / gray-500 / gray-900`

---

## 4. Shadow

Dùng Tailwind built-in shadows — KHÔNG tạo custom shadow trong `tailwind.config.js` (sẽ gây lỗi `@apply`):

- Card mặc định: `shadow-sm`
- Card khi hover: `hover:shadow-md transition-all duration-200`
- Modal/Popup: `shadow-2xl`

> **Lưu ý quan trọng:** Custom values trong `tailwind.config.js` (colors, boxShadow, v.v.) **KHÔNG dùng được với `@apply`** trong CSS file do Tailwind JIT xử lý CSS trước khi scan content. Chỉ dùng Tailwind built-in utilities với `@apply`.

---

## 5. Component Classes (định nghĩa trong `src/index.css`)

### Buttons
```
.btn-primary    — Nền indigo, text trắng, dùng cho action chính
.btn-secondary  — Nền trắng, border gray, dùng cho action phụ
.btn-danger     — Nền đỏ, dùng cho xóa / hành động nguy hiểm
.btn-ghost      — Không nền, text gray, dùng cho icon button
```

**Cú pháp chuẩn:**
```jsx
<button className="btn-primary">Lưu</button>
<button className="btn-primary gap-2"><FiSave size={15}/> Lưu</button>
<button className="btn-primary py-1.5 px-3 text-xs">Nhỏ</button>
```

### Card
```
.card  — bg-white rounded-xl border border-gray-200 shadow-card p-5
```

### Input
```
.input — border gray-200, focus ring indigo-500/30, rounded-lg, text-sm
```

Luôn dùng `.input` class, không tự viết Tailwind inline cho form field.

### Badges
```
.badge-green    — Emerald (đạt, tốt, đã trong lớp)
.badge-red      — Red (không đạt, xóa)
.badge-yellow   — Amber (trung bình, cảnh báo)
.badge-indigo   — Primary (số lượng, label info)
.badge-gray     — Neutral
```

### Table
```
.table-row      — border-b hover:bg-gray-50 transition-colors
.table-head     — text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4
.table-cell     — py-3 px-4 text-sm text-gray-700
```

### Page layout
```
.page-header    — flex items-center justify-between mb-6
.page-title     — text-xl font-semibold text-gray-900
.stat-card      — card flex items-center gap-4
.stat-icon      — w-11 h-11 rounded-xl flex items-center justify-center shrink-0
```

---

## 6. Icons

**Luôn dùng `react-icons/fi` (Feather Icons).**  
Không dùng emoji thay icon trong component.

```jsx
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiLoader } from 'react-icons/fi';
```

Icon thường dùng:
| Tác dụng | Icon |
|---|---|
| Thêm | `FiPlus` |
| Xóa | `FiTrash2` |
| Sửa | `FiEdit2` |
| Xem | `FiEye` |
| Tìm kiếm | `FiSearch` |
| Loading | `FiLoader` + `animate-spin` |
| Đóng modal | `FiX` |
| Lưu | `FiSave` |
| AI / tạo | `FiZap` |
| Đăng xuất | `FiLogOut` |
| Mũi tên phải | `FiArrowRight` |
| Reload | `FiRefreshCw` |

---

## 7. Modal / Popup

Cấu trúc chuẩn:

```jsx
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6">
    {/* header */}
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-semibold text-gray-900">Tiêu đề</h3>
      <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
        <FiX size={17} />
      </button>
    </div>
    {/* body */}
    {/* footer */}
    <div className="flex gap-3 mt-5">
      <button className="btn-secondary flex-1">Hủy</button>
      <button className="btn-primary flex-1">Xác nhận</button>
    </div>
  </div>
</div>
```

`max-w-sm` cho modal nhỏ (confirm), `max-w-3xl` cho modal lớn (exam editor).

---

## 8. Loading States

```jsx
// Spinner inline
<FiLoader size={20} className="animate-spin text-gray-400" />

// Loading skeleton (dùng khi chưa có data)
<div className="h-24 bg-gray-100 rounded-xl animate-pulse" />

// Button loading
<button disabled={loading}>
  {loading ? <><FiLoader size={14} className="animate-spin" /> Đang xử lý...</> : 'Lưu'}
</button>
```

---

## 9. Empty States

```jsx
<div className="text-center py-20">
  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
    <FiBook size={22} className="text-gray-400" />
  </div>
  <p className="text-gray-500 font-medium">Chưa có dữ liệu</p>
  <p className="text-sm text-gray-400 mt-1">Mô tả hành động tiếp theo</p>
</div>
```

---

## 10. Sidebar

File: `src/components/Sidebar.jsx`

- Nền trắng, `border-r border-gray-200`
- Active link: `bg-indigo-50 text-indigo-700`
- Inactive: `text-gray-600 hover:bg-gray-100`
- Logo: hình vuông 9×9 `bg-indigo-600 rounded-xl`
- Icons từ `react-icons/fi`
- Logout ở footer: hover `bg-red-50 text-red-600`

---

## 11. Form Fields

```jsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    Tên trường <span className="text-red-500">*</span>
  </label>
  <input className="input" placeholder="..." />
</div>
```

---

## 12. Quy tắc chung

- **KHÔNG** tự viết Tailwind dài inline khi đã có class tương đương (`.card`, `.input`, `.btn-*`)
- **KHÔNG** dùng `shadow-xl`, `shadow-lg` thay vì `shadow-card` / `shadow-modal`
- **KHÔNG** dùng `bg-indigo-*` trực tiếp — dùng `bg-indigo-*`
- **KHÔNG** thêm emoji vào button hay heading
- **KHÔNG** thay đổi logic nghiệp vụ, API, routing khi refactor UI
- **Luôn** dùng `transition-all duration-150` hoặc `transition-colors` cho hover effects
- **Luôn** thêm `disabled:opacity-50 disabled:pointer-events-none` cho button có loading state
- **Luôn** dùng `text-sm` làm font size mặc định cho nội dung trong card/table
