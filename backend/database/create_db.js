import 'dotenv/config';
import * as mysql from 'mariadb';
import bcrypt from 'bcryptjs';

const config = {
  host:            process.env.DB_HOST     || '127.0.0.1',
  port:            parseInt(process.env.DB_PORT || '3306'),
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || process.env.DB_PASS || '',
  connectionLimit: 1,
};
const DB_NAME = 'math_learning';

async function main() {
  let conn;
  try {
    conn = await mysql.createConnection(config);

    await conn.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    await conn.query(`CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE ${DB_NAME}`);

    await conn.query(`
      CREATE TABLE users (
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
      )`);

    await conn.query(`
      CREATE TABLE classes (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        class_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
      )`);

    await conn.query(`
      ALTER TABLE users
        ADD CONSTRAINT fk_user_class
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL`);

    await conn.query(`
      CREATE TABLE student_parents (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        student_id   INT UNIQUE NOT NULL,
        parent_name  VARCHAR(100),
        parent_phone VARCHAR(20) UNIQUE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

    await conn.query(`
      CREATE TABLE student_relatives (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        student_id   INT NOT NULL,
        name         VARCHAR(100) NOT NULL,
        phone        VARCHAR(20)  NOT NULL,
        email        VARCHAR(100) NULL,
        relationship VARCHAR(50),
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

    await conn.query(`
      CREATE TABLE lessons (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        title      VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
      )`);

    await conn.query(`
      CREATE TABLE exams (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        lesson_id    INT NOT NULL,
        name         VARCHAR(255) NOT NULL,
        description  TEXT,
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
      )`);

    await conn.query(`
      CREATE TABLE questions (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        exam_id     INT NOT NULL,
        content     TEXT NOT NULL,
        explanation TEXT,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      )`);

    await conn.query(`
      CREATE TABLE answers (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        content     TEXT NOT NULL,
        is_correct  TINYINT(1) DEFAULT 0,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )`);

    await conn.query(`
      CREATE TABLE student_answers (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        student_id   INT NOT NULL,
        exam_id      INT NOT NULL,
        answer_id    INT NOT NULL,
        time_spent   INT DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id)    REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (answer_id)  REFERENCES answers(id) ON DELETE CASCADE
      )`);

    await conn.query(`
      CREATE TABLE class_exams (
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
      )`);

    await conn.query(`
      CREATE TABLE student_exam_comments (
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
      )`);

    await conn.query(`
      CREATE TABLE announcements (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        class_id   INT NOT NULL,
        teacher_id INT NOT NULL,
        title      VARCHAR(255) NOT NULL,
        content    TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES users(id)   ON DELETE CASCADE
      )`);

    await conn.query(`
      CREATE TABLE question_bank (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id  INT NOT NULL,
        lesson_id   INT,
        content     TEXT NOT NULL,
        explanation TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id)  REFERENCES lessons(id) ON DELETE SET NULL
      )`);

    await conn.query(`
      CREATE TABLE question_bank_answers (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        content     TEXT NOT NULL,
        is_correct  TINYINT(1) DEFAULT 0,
        FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
      )`);

    await conn.query(`
      CREATE TABLE chat_sessions (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

    await conn.query(`
      CREATE TABLE chat_messages (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        role       ENUM('user','assistant') NOT NULL,
        content    TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      )`);

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
    const hs1Id = hs1Result.insertId;
    await conn.query(
      "INSERT INTO student_relatives (student_id, name, phone, relationship) VALUES (?, 'Anh Hùng', '0909000111', 'Bố')",
      [hs1Id]
    );

    const hs2Result = await conn.query(
      "INSERT INTO users (username, password, full_name, role, class_id) VALUES ('hs2', ?, 'Trần Thị Bé', 'student', ?)",
      [pw, classId]
    );
    const hs2Id = hs2Result.insertId;
    await conn.query(
      "INSERT INTO student_relatives (student_id, name, phone, relationship) VALUES (?, 'Chị Hoa', '0909000222', 'Mẹ')",
      [hs2Id]
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
    const examId = examResult.insertId;

    await conn.query(
      "INSERT INTO class_exams (class_id, exam_id, time_limit) VALUES (?, ?, 900)",
      [classId, examId]
    );

    console.log('>>> Database tạo thành công!');
    console.log('    Giáo viên : gv1 / 123');
    console.log('    Học sinh  : hs1 / 123  |  hs2 / 123');
  } catch (err) {
    console.error('Lỗi:', err);
  } finally {
    if (conn) conn.end();
  }
}

main();
