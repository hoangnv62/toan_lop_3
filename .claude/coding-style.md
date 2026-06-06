# Convention và Best Practice

## Module System

Backend dùng **ESM** (`"type": "module"` trong package.json):

```javascript
// Đúng
import { query } from '../config/database.js';
export const findById = (id) => ...;

// Sai — CommonJS không dùng
const { query } = require('../config/database');
module.exports = { findById };
```

Luôn có extension `.js` trong import path.

---

## Naming Conventions

### Files
- **kebab-case** cho tất cả: `question-bank.service.js`, `error-handler.middleware.js`
- Pattern: `<domain>.<layer>.js`

### Code
| Context | Convention | Ví dụ |
|---------|-----------|-------|
| Variables, functions | camelCase | `userId`, `lessonId`, `findByTeacher` |
| DB column names | snake_case | `user_id`, `is_correct`, `created_at` |
| Classes | PascalCase | `AppError`, `NotFoundError` |
| Constants (module-level) | UPPER_SNAKE | `DEFAULT_MODEL`, `MAX_LIMIT` |
| React components | PascalCase | `QuestionBank`, `StudentHome` |
| React hooks | camelCase, prefix `use` | `useAuth`, `useDebounce` |

### Imports

Backend — namespace imports:
```javascript
import * as ctrl from '../controllers/question-bank.controller.js';
import * as svc  from '../services/question-bank.service.js';
import * as repo from '../repositories/question-bank.repository.js';
```

Named imports cho utilities và errors:
```javascript
import { query, queryOne, insert } from '../config/database.js';
import { NotFoundError, ForbiddenError } from '../utils/error.utils.js';
```

---

## Backend Patterns

### Controller exports — named, không default
```javascript
export const list   = async (req, res) => { ... };
export const create = async (req, res) => { ... };
export const update = async (req, res) => { ... };
export const remove = async (req, res) => { ... };
```

### Hàm ngắn, 1 concern
```javascript
// Đúng
export const findById = (id) =>
  queryOne('SELECT * FROM question_bank WHERE id = :id', { id });

// Sai — gộp nhiều concern
export const findByIdAndCheckOwner = async (id, teacherId) => {
  const q = await queryOne('...', { id });
  if (!q || q.teacher_id !== teacherId) throw new ForbiddenError();
  return q;
};
```

### parseInt cho params từ URL
```javascript
const id = parseInt(req.params.id);
const page = parseInt(req.query.page) || 1;
```

### Null handling
```javascript
lessonId: lessonId ?? null   // dùng ?? thay vì ||
explanation: explanation || null  // chấp nhận khi falsy là string rỗng
```

---

## Error Classes

Throw đúng class, không throw string hay generic Error:

```javascript
// Đúng
throw new NotFoundError('Câu hỏi không tồn tại');
throw new ForbiddenError();  // dùng default message

// Sai
throw new Error('Not found');
throw 'Không tìm thấy';
```

---

## Async/Await

Không dùng `.then().catch()` — dùng async/await:

```javascript
// Đúng
export const getById = async (id) => {
  const row = await queryOne('SELECT * FROM ...', { id });
  if (!row) throw new NotFoundError();
  return row;
};

// Sai
export const getById = (id) =>
  queryOne('SELECT * FROM ...', { id })
    .then(row => { if (!row) throw new NotFoundError(); return row; });
```

---

## Frontend Patterns

### State naming
```javascript
const [lessons, setLessons] = useState([]);
const [loading, setLoading] = useState(false);
const [editLesson, setEditLesson] = useState(null);  // null = modal đóng
```

### Handler naming
```javascript
const handleCreate = async (data) => { ... };
const handleEdit   = async (id, data) => { ... };
const handleDelete = async (id) => { ... };
const handleSearch = (value) => { ... };
```

### Async handler pattern
```javascript
const handleCreate = async (data) => {
  try {
    await createBankQuestion(data);
    toast.success('Tạo thành công');
    setShowModal(false);
    loadData();
  } catch (err) {
    toast.error(err.message || 'Có lỗi xảy ra');
  }
};
```

### Ref naming
```javascript
const debounceRef = useRef(null);
const inputRef    = useRef(null);
const bottomRef   = useRef(null);
```

---

## Comments

Không viết comment giải thích code làm gì — tên hàm/biến phải tự mô tả.

Viết comment khi:
- Có ràng buộc ẩn hoặc workaround cho bug cụ thể
- Logic thoạt nhìn có vẻ sai nhưng đúng vì lý do không hiển nhiên

```javascript
// Sai — comment thừa
// Hàm tìm câu hỏi theo id
export const findById = (id) => queryOne('SELECT * FROM question_bank WHERE id = :id', { id });

// Đúng — comment giải thích WHY
// MariaDB trả bigint dưới dạng string nếu không set bigIntAsNumber — đã config trong pool
const total = Number(row.total);
```

---

## SQL Conventions

- Named parameters: `:paramName` (không dùng `?`)
- Table names: snake_case số nhiều — `question_bank`, `class_exams`
- Column names: snake_case — `teacher_id`, `is_correct`
- INSERT chỉ liệt kê columns cần thiết (không dùng `INSERT INTO t VALUES (...)`)
- SELECT chỉ lấy columns cần (tránh `SELECT *` trong production queries — chấp nhận trong `findById`)

---

## Không làm

- Không dùng ORM (chỉ raw SQL)
- Không tạo thêm Context React trừ khi thực sự cần
- Không dùng `var` — chỉ `const` / `let`
- Không xóa code cũ bằng comment — xóa hẳn
- Không commit file `.env`
- Không dùng `console.log` trong production code — chỉ `console.error` cho unexpected errors
- Không hardcode URL — dùng `API_BASE` từ `config.js`
- Không hardcode SQL trong Tool Handler — phải qua Domain Service
- Không hardcode prompt trong source `.js` — lưu trong `src/prompts/*.md`
