# Database Rules

> This project uses **raw SQL via the `mariadb` npm package**. There is no ORM. All queries go in repository files.

---

## General Rules

- **All SQL queries belong in `src/repositories/`** — never in services or controllers
- **Always use parameterized queries** — never concatenate user input into SQL strings
- **Always release connections** in a `finally` block
- Use **transactions** for multi-step operations that must be atomic

---

## Connection Pattern

```js
// src/config/database.js — connection pool (shared singleton)
import mariadb from 'mariadb';

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

export default pool;
```

```js
// ✅ Always get + release
const conn = await pool.getConnection();
try {
  const rows = await conn.query('SELECT ...', [params]);
  return rows;
} finally {
  conn.release();   // MUST release even on error
}

// ❌ Never create a new Pool per request
// ❌ Never skip the finally block
```

---

## Query Best Practices

```js
// ✅ Parameterized query — safe
const rows = await conn.query(
  'SELECT id, full_name, email FROM users WHERE id = ?',
  [userId]
);

// ✅ Select only needed columns — never SELECT *
const rows = await conn.query(
  'SELECT id, title, created_at FROM exams WHERE class_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
  [classId, limit, offset]
);

// ❌ String concatenation — SQL injection risk
const rows = await conn.query(`SELECT * FROM users WHERE id = ${userId}`);
```

---

## Transactions

```js
const conn = await pool.getConnection();
await conn.beginTransaction();
try {
  const exam = await conn.query('INSERT INTO exams (title, lesson_id) VALUES (?, ?)', [title, lessonId]);
  const examId = Number(exam.insertId);

  for (const q of questions) {
    await conn.query(
      'INSERT INTO questions (exam_id, content) VALUES (?, ?)',
      [examId, q.content]
    );
  }

  await conn.commit();
  return examId;
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

---

## Naming Conventions

- Tables: **snake_case** plural (`users`, `exam_submissions`, `question_bank`)
- Columns: **snake_case** (`created_at`, `user_id`, `full_name`)
- Indexes: `idx_[table]_[column]` (e.g. `idx_users_email`)
- Foreign keys: `fk_[table]_[referenced_table]`

---

## camelCase Conversion

The `camelcase-response.middleware.js` middleware auto-converts snake_case DB column names to camelCase in all JSON responses. This means:
- DB column `full_name` → JSON field `fullName`
- DB column `created_at` → JSON field `createdAt`
- Write SQL with snake_case, receive camelCase in frontend — no manual mapping needed

---

## Migrations

- Schema lives in `database/create_db.js` — run once to initialize
- For schema changes: modify `create_db.js` and document the change
- No migration framework is set up — coordinate schema changes manually

---

## Security

- **Never log query results** containing passwords, tokens, or PII
- **Always parameterize** — `?` placeholders, not string interpolation
- Validate input with Zod **before** it reaches the repository

---

## N+1 Prevention

```js
// ❌ N+1 — one query per student
for (const student of students) {
  student.scores = await conn.query('SELECT * FROM scores WHERE student_id = ?', [student.id]);
}

// ✅ Single query with JOIN
const rows = await conn.query(`
  SELECT s.id, s.full_name, sc.score, sc.submitted_at
  FROM students s
  LEFT JOIN exam_submissions sc ON sc.student_id = s.id AND sc.exam_id = ?
  WHERE s.class_id = ?
`, [examId, classId]);
```
