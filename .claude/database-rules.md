# Quy chuẩn Repository và Service

## Repository — Chỉ thao tác database

Repository chỉ được chứa:
- SQL queries
- Xử lý kết quả raw từ DB

Repository **không được chứa**:
- Business logic / validation
- Business rules (kiểm tra quyền, kiểm tra trùng lặp nghiệp vụ)
- AI prompt
- Format / transform dữ liệu phức tạp
- Throw AppError (chỉ throw DB error tự nhiên)

---

## DB Query Helpers

Import từ `src/config/database.js`:

```javascript
import { query, queryOne, insert, transaction } from '../config/database.js';

query(sql, params)           // → rows[]
queryOne(sql, params)        // → row | null
insert(sql, params)          // → insertId (number)
transaction(async (conn) => { ... })  // → return value của callback
```

**Luôn dùng named parameters** — không dùng positional `?`:

```javascript
// Đúng
queryOne('SELECT * FROM users WHERE id = :id AND role = :role', { id, role });

// Sai
queryOne('SELECT * FROM users WHERE id = ? AND role = ?', [id, role]);
```

---

## Pattern Repository chuẩn

```javascript
// src/repositories/question-bank.repository.js
import { query, queryOne, insert, transaction } from '../config/database.js';

export const findById = (id) =>
  queryOne('SELECT * FROM question_bank WHERE id = :id', { id });

export const findByTeacher = async (teacherId, { q = '', lessonId, limit = 10, offset = 0 } = {}) => {
  const params = { tid: teacherId };
  let where = 'WHERE teacher_id = :tid';

  if (q) {
    where += ' AND content LIKE :q';
    params.q = `%${q}%`;
  }
  if (lessonId === 0) {
    where += ' AND lesson_id IS NULL';
  } else if (lessonId != null) {
    where += ' AND lesson_id = :lessonId';
    params.lessonId = lessonId;
  }

  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM question_bank ${where}`, params);
  params.limit = limit;
  params.offset = offset;
  const rows = await query(
    `SELECT id, content, explanation, lesson_id, created_at FROM question_bank ${where}
     ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
    params
  );
  return { rows, total: Number(total) };
};

export const create = async (teacherId, lessonId, content, explanation) => {
  return insert(
    'INSERT INTO question_bank (teacher_id, lesson_id, content, explanation) VALUES (:teacherId, :lessonId, :content, :explanation)',
    { teacherId, lessonId: lessonId ?? null, content, explanation: explanation ?? null }
  );
};

export const createWithAnswers = (teacherId, lessonId, content, explanation, answers) =>
  transaction(async (conn) => {
    const result = await conn.query(
      'INSERT INTO question_bank (teacher_id, lesson_id, content, explanation) VALUES (:teacherId, :lessonId, :content, :explanation)',
      { teacherId, lessonId: lessonId ?? null, content, explanation: explanation ?? null }
    );
    const qId = result.insertId;
    for (const a of answers) {
      await conn.query(
        'INSERT INTO question_bank_answers (question_id, content, is_correct) VALUES (:qId, :content, :isCorrect)',
        { qId, content: a.content, isCorrect: a.isCorrect ? 1 : 0 }
      );
    }
    return qId;
  });

export const remove = (id) =>
  query('DELETE FROM question_bank WHERE id = :id', { id });
```

---

## Pagination Pattern

```javascript
// Trong repository
const offset = (page - 1) * limit;
const [{ total }] = await query(`SELECT COUNT(*) AS total FROM ... ${where}`, params);
const rows = await query(`SELECT ... ${where} ORDER BY ... LIMIT :limit OFFSET :offset`, { ...params, limit, offset });
return { rows, total: Number(total) };

// Trong service — build pagination response
return {
  items: rows.map(formatRow),
  total,
  page,
  pages: Math.max(1, Math.ceil(total / limit)),
};
```

---

## Dynamic WHERE

```javascript
const params = { tid: teacherId };
let where = 'WHERE teacher_id = :tid';

if (q) {
  where += ' AND content LIKE :q';
  params.q = `%${q}%`;
}
```

Không dùng string interpolation trực tiếp vào SQL (SQL injection):
```javascript
// Sai
`WHERE content LIKE '%${q}%'`

// Đúng
where += ' AND content LIKE :q';
params.q = `%${q}%`;
```

---

## Transaction

Dùng cho mọi thao tác multi-query phải atomic:

```javascript
export const createExam = (lessonId, name, description, questions) =>
  transaction(async (conn) => {
    const examResult = await conn.query(
      'INSERT INTO exams (lesson_id, name, description) VALUES (:lessonId, :name, :description)',
      { lessonId, name, description }
    );
    const examId = examResult.insertId;

    for (const q of questions) {
      const qResult = await conn.query(
        'INSERT INTO questions (exam_id, content, explanation) VALUES (:examId, :content, :explanation)',
        { examId, content: q.questionContent, explanation: q.explanation ?? null }
      );
      for (const a of q.answers) {
        await conn.query(
          'INSERT INTO answers (question_id, content, is_correct) VALUES (:qId, :content, :isCorrect)',
          { qId: qResult.insertId, content: a.content, isCorrect: a.isCorrected ? 1 : 0 }
        );
      }
    }
    return examId;
  });
```

---

## Service — Business Logic

Service là nơi duy nhất chứa business logic. Không được truy cập DB trực tiếp.

```javascript
// src/services/question-bank.service.js
import * as repo from '../repositories/question-bank.repository.js';
import { NotFoundError, ForbiddenError } from '../utils/error.utils.js';

export const search = async (teacherId, { topic, lessonId, limit = 10, page = 1 }) => {
  const offset = (page - 1) * Math.min(limit, 50);
  const { rows, total } = await repo.findByTeacher(teacherId, { q: topic, lessonId, limit, offset });
  const items = [];
  for (const row of rows) {
    const answers = await repo.findAnswers(row.id);
    items.push({
      id: row.id,
      content: row.content,
      explanation: row.explanation,
      lessonId: row.lesson_id ?? null,
      answers: answers.map(a => ({
        id: a.id,
        content: a.content,
        isCorrect: a.is_correct === 1,
      })),
    });
  }
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
};

export const create = async (teacherId, { content, explanation, lessonId, answers }) => {
  if (!answers || answers.length !== 4) throw new BadRequestError('Câu hỏi phải có đúng 4 đáp án');
  const correctCount = answers.filter(a => a.isCorrect).length;
  if (correctCount !== 1) throw new BadRequestError('Phải có đúng 1 đáp án đúng');
  return repo.createWithAnswers(teacherId, lessonId, content, explanation, answers);
};

export const remove = async (id, teacherId) => {
  const q = await repo.findById(id);
  if (!q) throw new NotFoundError('Câu hỏi không tồn tại');
  if (q.teacher_id !== teacherId) throw new ForbiddenError();
  await repo.remove(id);
};
```

---

## Quy tắc Service

- Import repository dưới dạng namespace: `import * as repo`
- Không trực tiếp query DB
- Validate ownership trước khi update/delete: kiểm tra `teacher_id === req.user.user_id`
- Throw named AppError class — không throw generic Error
- Return plain object — không có HTTP response concept
- Một domain service, một file: `question-bank.service.js`

---

## Date Utilities

```javascript
import { formatDate, formatDateTime } from '../utils/date.utils.js';

formatDate(value)     // → "dd/mm/yyyy" hoặc null
formatDateTime(value) // → "dd/mm/yyyy HH:mm" hoặc null
```

Luôn dùng utilities này để format date — không dùng `.toLocaleDateString()` hay tự format.

---

## Schema Database

Xem đầy đủ tại `.claude/sql.md` trong thư mục backend.

Các bảng chính: `users`, `classes`, `lessons`, `exams`, `questions`, `answers`,
`student_answers`, `class_exams`, `question_bank`, `question_bank_answers`,
`announcements`, `student_relatives`, `student_exam_comments`.
