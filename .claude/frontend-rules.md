# Quy chuẩn Frontend (React)

## API Layer

### Axios instance (`src/api/index.js`)

- Tất cả request đi qua axios instance duy nhất
- Request interceptor tự inject `Authorization: Bearer <token>`
- Response interceptor tự unwrap `json.data`; throw Error nếu `success: false`
- Token lưu tại `localStorage.auth_token`, quản lý bằng `getToken()`, `setToken()`, `clearToken()`

### Service files

Mỗi domain có một file service riêng. Service chỉ là thin wrapper:

```javascript
// src/api/questionBankService.js
import api from './index.js';

export const getQuestionBank = (params) => api.get('/api/question-bank', { params });
export const createBankQuestion = (data) => api.post('/api/question-bank', data);
export const updateBankQuestion = (id, data) => api.put(`/api/question-bank/${id}`, data);
export const deleteBankQuestion = (id) => api.delete(`/api/question-bank/${id}`);
export const importQuestionBankFromExcel = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/question-bank/import-excel', form);
};
```

Không viết business logic trong service file. Không dùng `fetch` trực tiếp.

---

## State Management

- **Context + useState** — không dùng Redux
- Auth state: `useAuth()` → `{ user, setUser, loading }`
- Local UI state: `useState` trong từng component
- Không tạo thêm Context trừ khi thực sự cần share state sâu nhiều tầng

---

## Error Handling

```javascript
import { toast } from 'react-toastify';

try {
  await createBankQuestion(data);
  toast.success('Tạo thành công');
  onClose();
} catch (err) {
  toast.error(err.message || 'Có lỗi xảy ra');
}
```

- Dùng `toast.success()`, `toast.error()` cho mọi feedback user
- Catch block luôn phải có `toast.error()` — không để silent failure với user
- Loading state phải reset trong `finally`

---

## Component Structure

Thứ tự trong component:

```jsx
export default function QuestionBank() {
  // 1. Hooks (useAuth, useState, useRef, useEffect)
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  // 2. useEffect (load data, debounce)
  useEffect(() => { loadData(); }, [page, query]);

  // 3. Async handlers
  const loadData = async () => { ... };
  const handleCreate = async (data) => { ... };
  const handleDelete = async (id) => { ... };

  // 4. JSX
  return (
    <div>
      {/* Header */}
      {/* List / Table */}
      {/* Pagination */}
      {/* Modals — conditionally rendered */}
    </div>
  );
}
```

---

## Loading & Empty State

```jsx
{loading ? (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
  </div>
) : items.length === 0 ? (
  <div className="text-center py-12 text-slate-400">Chưa có dữ liệu</div>
) : (
  <ul>...</ul>
)}
```

---

## Modal Pattern

```jsx
// Modal state trong parent
const [editItem, setEditItem] = useState(null);

// Render conditional
{editItem && (
  <ItemFormModal
    item={editItem}
    onClose={() => setEditItem(null)}
    onSubmit={handleUpdate}
  />
)}

// Modal component
export default function ItemFormModal({ item, onClose, onSubmit }) {
  const inputRef = useRef();
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* ... */}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
          <button onClick={handleSubmit} className="btn-primary flex-1">Lưu</button>
        </div>
      </div>
    </div>
  );
}
```

Keyboard support: Enter = submit, Escape = close.

---

## Tailwind Classes chuẩn

Dùng custom classes từ `src/index.css` — không tái tạo bằng Tailwind utilities:

| Class | Dùng khi |
|-------|----------|
| `.btn-primary` | Hành động chính (tạo, lưu, xác nhận) |
| `.btn-secondary` | Hủy, quay lại |
| `.btn-danger` | Xóa, hành động nguy hiểm |
| `.btn-ghost` | Nút phụ không nổi bật |
| `.card` | Container card trắng có shadow |
| `.input` | Input, textarea, select |
| `.badge-indigo/green/yellow/gray` | Tag trạng thái |
| `.table-head`, `.table-row`, `.table-cell` | Bảng dữ liệu |

Primary color: `indigo` (các utilities Tailwind dùng `indigo-*`).

---

## Debounce Search

```javascript
const debounceRef = useRef(null);

const handleSearch = (value) => {
  setQuery(value);
  clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    setPage(1);
    loadData(value, 1);
  }, 500);
};
```

---

## Pagination

```jsx
<Pagination page={page} pages={pages} onChange={(p) => setPage(p)} />
```

Reset `page = 1` khi thay đổi query filter.

---

## Icons

Dùng `react-icons/fi` (Feather icons):

```javascript
import { FiPlus, FiEdit, FiTrash2, FiCopy, FiSend, FiDownload } from 'react-icons/fi';
```

---

## Chat Streaming

```javascript
await streamChat(
  messages,
  user?.role,
  (token) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[updated.length - 1].content += token;
      return updated;
    });
  },
  () => setLoading(false)
);
```

Xử lý SSE event types:
- `tool_start` → hiển thị indicator *"Đang tìm câu hỏi..."*
- `tool_done` → ẩn indicator
- `token` → append vào message hiện tại
- `[DONE]` → kết thúc stream

---

## File Download

```javascript
import { downloadBlob } from '../api/index.js';

const blob = await exportStudents(classId);
downloadBlob(blob, `danh-sach-${className}.xlsx`);
```

---

## Vietnamese Text

Toàn bộ UI text bằng tiếng Việt. Không dùng text tiếng Anh trong giao diện.
Error messages từ API đã là tiếng Việt — dùng trực tiếp `err.message`.
