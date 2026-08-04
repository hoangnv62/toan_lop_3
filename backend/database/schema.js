import bcrypt from 'bcryptjs';

// Ordered CREATE TABLE statements (dependency order). All use IF NOT EXISTS so
// they are safe to run on an existing database — the init-on-startup flow and
// the manual reset script (create_db.js) both reuse these.
// Note: users.class_id references classes(id), but classes references users(id)
// too, so the FK on users.class_id is added afterwards via addUserClassForeignKey.
export const TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    full_name  VARCHAR(100) NOT NULL,
    role       ENUM('teacher','student') NOT NULL,
    dob        DATE,
    email      VARCHAR(100),
    phone      VARCHAR(20),
    class_id   INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS classes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  )`,

  `CREATE TABLE IF NOT EXISTS student_parents (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    student_id   INT UNIQUE NOT NULL,
    parent_name  VARCHAR(100),
    parent_phone VARCHAR(20) UNIQUE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS student_relatives (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    student_id   INT NOT NULL,
    name         VARCHAR(100) NOT NULL,
    phone        VARCHAR(20)  NOT NULL,
    email        VARCHAR(100) NULL,
    relationship VARCHAR(50),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS lessons (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    title      VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  )`,

  `CREATE TABLE IF NOT EXISTS exams (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id    INT NOT NULL,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS questions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    exam_id     INT NOT NULL,
    content     TEXT NOT NULL,
    explanation TEXT,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS answers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    content     TEXT NOT NULL,
    is_correct  TINYINT(1) DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS student_answers (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    student_id   INT NOT NULL,
    exam_id      INT NOT NULL,
    answer_id    INT NOT NULL,
    time_spent   INT DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id)    REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_id)  REFERENCES answers(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS class_exams (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    class_id    INT NOT NULL,
    exam_id     INT NOT NULL,
    deadline    DATETIME,
    open_time   DATETIME,
    time_limit  INT NOT NULL DEFAULT 1200,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_class_exam (class_id, exam_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id)  REFERENCES exams(id)   ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS student_exam_comments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    exam_id    INT NOT NULL,
    student_id INT NOT NULL,
    teacher_id INT NOT NULL,
    comment    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_sec (exam_id, student_id),
    FOREIGN KEY (exam_id)    REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS announcements (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    class_id   INT NOT NULL,
    teacher_id INT NOT NULL,
    title      VARCHAR(255) NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id)   ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS question_bank (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id  INT NOT NULL,
    lesson_id   INT NOT NULL,
    content     TEXT NOT NULL,
    explanation TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id)  REFERENCES lessons(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS question_bank_answers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    content     TEXT NOT NULL,
    is_correct  TINYINT(1) DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS chat_sessions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS chat_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role       ENUM('user','assistant') NOT NULL,
    content    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
  )`,
];

// users.class_id ↔ classes(id) is a circular FK, so it can't be inline in the
// users CREATE TABLE. Added here, but only if it doesn't already exist so the
// call is safe to repeat on every startup.
export async function addUserClassForeignKey(conn, dbName) {
  const rows = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ?
       AND TABLE_NAME = 'users'
       AND CONSTRAINT_NAME = 'fk_user_class'`,
    [dbName]
  );
  if (Number(rows[0].c) > 0) return;

  await conn.query(`
    ALTER TABLE users
      ADD CONSTRAINT fk_user_class
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL`);
}

// Database tạo trước bản này có question_bank.lesson_id cho phép NULL ("chưa phân
// loại"). Mọi câu hỏi giờ đều bắt buộc thuộc một bài học, nên siết lại NOT NULL và
// đổi FK SET NULL -> CASCADE (SET NULL không thể tồn tại cùng cột NOT NULL).
export async function enforceQuestionBankLessonNotNull(conn, dbName) {
  const [col] = await conn.query(
    `SELECT IS_NULLABLE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'question_bank' AND COLUMN_NAME = 'lesson_id'`,
    [dbName]
  );
  if (!col || col.IS_NULLABLE === 'NO') return;

  // Không tự ý gán bừa hay xóa dữ liệu của giáo viên: còn dòng NULL thì báo để
  // người dùng tự phân loại, chứ không chặn app khởi động.
  const [{ nulls }] = await conn.query(
    'SELECT COUNT(*) AS nulls FROM question_bank WHERE lesson_id IS NULL'
  );
  if (Number(nulls) > 0) {
    console.warn(
      `>>> BỎ QUA ràng buộc NOT NULL cho question_bank.lesson_id: còn ${nulls} câu hỏi chưa có chủ đề.\n` +
      '    Hãy gán chủ đề cho các câu đó rồi khởi động lại để ràng buộc được áp dụng.'
    );
    return;
  }

  // Tên FK do MariaDB tự sinh (question_bank_ibfk_N) nên phải tra ngược ra.
  const fks = await conn.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'question_bank'
       AND COLUMN_NAME = 'lesson_id' AND REFERENCED_TABLE_NAME = 'lessons'`,
    [dbName]
  );
  for (const { CONSTRAINT_NAME } of fks) {
    await conn.query(`ALTER TABLE question_bank DROP FOREIGN KEY \`${CONSTRAINT_NAME}\``);
  }

  await conn.query('ALTER TABLE question_bank MODIFY COLUMN lesson_id INT NOT NULL');
  await conn.query(`
    ALTER TABLE question_bank
      ADD CONSTRAINT fk_question_bank_lesson
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE`);

  console.log('>>> question_bank.lesson_id: đã siết NOT NULL + FK ON DELETE CASCADE');
}

// Inserts the demo teacher/students/lesson/exam. Assumes an empty schema —
// callers must guard with a "no users yet" check before invoking.
export async function seedSampleData(conn) {
  const pw = await bcrypt.hash('123', 10);

  const teacherResult = await conn.query(
    "INSERT INTO users (username, password, full_name, role) VALUES ('gv1', ?, 'Cô Giáo Lan', 'teacher')",
    [pw]
  );
  const teacherId = teacherResult.insertId;

  const classResult = await conn.query(
    "INSERT INTO classes (teacher_id, class_name) VALUES (?, '3A')",
    [teacherId]
  );
  const classId = classResult.insertId;

  const hs1Result = await conn.query(
    "INSERT INTO users (username, password, full_name, role, class_id) VALUES ('hs1', ?, 'Nguyễn Văn An', 'student', ?)",
    [pw, classId]
  );
  await conn.query(
    "INSERT INTO student_relatives (student_id, name, phone, relationship) VALUES (?, 'Anh Hùng', '0909000111', 'Bố')",
    [hs1Result.insertId]
  );

  const hs2Result = await conn.query(
    "INSERT INTO users (username, password, full_name, role, class_id) VALUES ('hs2', ?, 'Trần Thị Bé', 'student', ?)",
    [pw, classId]
  );
  await conn.query(
    "INSERT INTO student_relatives (student_id, name, phone, relationship) VALUES (?, 'Chị Hoa', '0909000222', 'Mẹ')",
    [hs2Result.insertId]
  );

  const lessonResult = await conn.query(
    "INSERT INTO lessons (teacher_id, title, description) VALUES (?, 'Phép cộng trong phạm vi 100', 'Ôn tập phép cộng cơ bản')",
    [teacherId]
  );
  const lessonId = lessonResult.insertId;

  const examResult = await conn.query(
    "INSERT INTO exams (lesson_id, name, description) VALUES (?, 'Kiểm tra 15 phút', 'Bài kiểm tra phép cộng')",
    [lessonId]
  );

  await conn.query(
    "INSERT INTO class_exams (class_id, exam_id, time_limit) VALUES (?, ?, 900)",
    [classId, examResult.insertId]
  );
}
