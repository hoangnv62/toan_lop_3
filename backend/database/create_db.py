import mysql.connector
from werkzeug.security import generate_password_hash

config = {'user': 'root', 'password': '', 'host': '127.0.0.1'}
DB_NAME = 'math_learning'

try:
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()

    cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
    cursor.execute(f"CREATE DATABASE {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    cursor.execute(f"USE {DB_NAME}")

    # 1. Users — giáo viên + học sinh chung 1 bảng, phân biệt bằng role
    cursor.execute("""
    CREATE TABLE users (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        username    VARCHAR(50)  UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        full_name   VARCHAR(100) NOT NULL,
        role        ENUM('teacher','student') NOT NULL,
        dob         DATE,
        email       VARCHAR(100),
        phone       VARCHAR(20),
        class_id    INT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    # 2. Lớp học
    cursor.execute("""
    CREATE TABLE classes (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id  INT NOT NULL,
        class_name  VARCHAR(100) NOT NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
    )""")

    # 3. FK class_id → classes cho users
    cursor.execute("""
    ALTER TABLE users
        ADD CONSTRAINT fk_user_class
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
    """)

    # 4. Thông tin phụ huynh cũ (giữ lại để tương thích)
    cursor.execute("""
    CREATE TABLE student_parents (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        student_id    INT UNIQUE NOT NULL,
        parent_name   VARCHAR(100),
        parent_phone  VARCHAR(20) UNIQUE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    )""")

    # 5. Thông tin người thân học sinh (thay thế student_parents)
    cursor.execute("""
    CREATE TABLE student_relatives (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        student_id   INT NOT NULL,
        name         VARCHAR(100) NOT NULL,
        phone        VARCHAR(20)  NOT NULL,
        relationship VARCHAR(50),
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    )""")

    # 6. Bài học
    cursor.execute("""
    CREATE TABLE lessons (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id  INT NOT NULL,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
    )""")

    # 7. Bài kiểm tra
    cursor.execute("""
    CREATE TABLE exams (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        lesson_id    INT NOT NULL,
        name         VARCHAR(255) NOT NULL,
        description  TEXT,
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    )""")

    # 8. Câu hỏi
    cursor.execute("""
    CREATE TABLE questions (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        exam_id     INT NOT NULL,
        content     TEXT NOT NULL,
        explanation TEXT,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    )""")

    # 9. Đáp án
    cursor.execute("""
    CREATE TABLE answers (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        content     TEXT NOT NULL,
        is_correct  TINYINT(1) DEFAULT 0,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )""")

    # 10. Bài làm của học sinh
    cursor.execute("""
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
    )""")

    # 11. Phân công bài kiểm tra cho lớp
    cursor.execute("""
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
    )""")

    # 12. Nhận xét của giáo viên cho bài làm học sinh
    cursor.execute("""
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
    )""")

    # 13. Thông báo lớp học
    cursor.execute("""
    CREATE TABLE announcements (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        class_id   INT NOT NULL,
        teacher_id INT NOT NULL,
        title      VARCHAR(255) NOT NULL,
        content    TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES users(id)   ON DELETE CASCADE
    )""")

    # 14. Ngân hàng câu hỏi
    cursor.execute("""
    CREATE TABLE question_bank (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id  INT NOT NULL,
        content     TEXT NOT NULL,
        explanation TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    )""")

    # 15. Đáp án ngân hàng câu hỏi
    cursor.execute("""
    CREATE TABLE question_bank_answers (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        content     TEXT NOT NULL,
        is_correct  TINYINT(1) DEFAULT 0,
        FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
    )""")

    # --- Dữ liệu mẫu ---
    pw = generate_password_hash('123')

    cursor.execute(
        "INSERT INTO users (username, password, full_name, role) VALUES ('gv1', %s, 'Cô Giáo Lan', 'teacher')",
        (pw,)
    )
    teacher_id = cursor.lastrowid

    cursor.execute(
        "INSERT INTO classes (teacher_id, class_name) VALUES (%s, '3A')",
        (teacher_id,)
    )
    class_id = cursor.lastrowid

    cursor.execute(
        "INSERT INTO users (username, password, full_name, role, class_id) VALUES ('hs1', %s, 'Nguyễn Văn An', 'student', %s)",
        (pw, class_id)
    )
    hs1_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO student_relatives (student_id, name, phone, relationship) VALUES (%s, 'Anh Hùng', '0909000111', 'Bố')",
        (hs1_id,)
    )

    cursor.execute(
        "INSERT INTO users (username, password, full_name, role, class_id) VALUES ('hs2', %s, 'Trần Thị Bé', 'student', %s)",
        (pw, class_id)
    )
    hs2_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO student_relatives (student_id, name, phone, relationship) VALUES (%s, 'Chị Hoa', '0909000222', 'Mẹ')",
        (hs2_id,)
    )

    # Bài học và đề thi mẫu
    cursor.execute(
        "INSERT INTO lessons (teacher_id, title, description) VALUES (%s, 'Phép cộng trong phạm vi 100', 'Ôn tập phép cộng cơ bản')",
        (teacher_id,)
    )
    lesson_id = cursor.lastrowid

    cursor.execute(
        "INSERT INTO exams (lesson_id, name, description) VALUES (%s, 'Kiểm tra 15 phút', 'Bài kiểm tra phép cộng')",
        (lesson_id,)
    )
    exam_id = cursor.lastrowid

    cursor.execute(
        "INSERT INTO class_exams (class_id, exam_id, time_limit) VALUES (%s, %s, 900)",
        (class_id, exam_id)
    )

    conn.commit()
    print(">>> Database tạo thành công!")
    print("    Giáo viên : gv1 / 123")
    print("    Học sinh  : hs1 / 123  |  hs2 / 123")
    cursor.close()
    conn.close()

except mysql.connector.Error as err:
    print(f"Lỗi: {err}")
