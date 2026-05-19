import mysql.connector

config = { 'user': 'root', 'password': '', 'host': '127.0.0.1' }
DB_NAME = 'elearning_math_db'

try:
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    # Reset lại toàn bộ DB
    cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
    cursor.execute(f"CREATE DATABASE {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    cursor.execute(f"USE {DB_NAME}")
    
    # 1. Bảng Giáo viên
    cursor.execute("""
    CREATE TABLE teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(50),
        full_name VARCHAR(100)
    )""")

    # 2. Bảng Học sinh (Liên kết với Giáo viên, Login bằng SĐT Phụ huynh)
    cursor.execute("""
    CREATE TABLE students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100),
        parent_name VARCHAR(100),
        parent_phone VARCHAR(20) UNIQUE,
        teacher_id INT,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    )""")

    # 3. Bảng Bài học (Lessons) - Mới thêm
    cursor.execute("""
    CREATE TABLE lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT,
        title VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    )""")

    # 4. Bảng Bộ đề (Exam Sets) - Giờ sẽ thuộc về Bài học
    cursor.execute("""
    CREATE TABLE exam_sets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lesson_id INT,
        title VARCHAR(255),
        status ENUM('draft', 'published') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    )""")

    # 5. Bảng Câu hỏi
    cursor.execute("""
    CREATE TABLE questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_set_id INT,
        question_text TEXT,
        svg_code LONGTEXT,
        options JSON,
        correct_answer VARCHAR(10),
        explanation TEXT,
        FOREIGN KEY (exam_set_id) REFERENCES exam_sets(id) ON DELETE CASCADE
    )""")

    # 6. Bảng Kết quả
    cursor.execute("""
    CREATE TABLE results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT,
        exam_set_id INT,
        score FLOAT,
        details JSON,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (exam_set_id) REFERENCES exam_sets(id) ON DELETE CASCADE
    )""")

    # --- TẠO DỮ LIỆU MẪU ĐỂ TEST LOGIN ---
    
    # Tạo Giáo viên: user='gv1', pass='123'
    cursor.execute("INSERT INTO teachers (username, password, full_name) VALUES ('gv1', '123', 'Cô Giáo Lan')")
    teacher_id = cursor.lastrowid
    
    # Tạo Học sinh: SĐT Phụ huynh='0909000111'
    cursor.execute(f"INSERT INTO students (full_name, parent_name, parent_phone, teacher_id) VALUES ('Nguyễn Văn An', 'Anh Hùng', '0909000111', {teacher_id})")
    
    # Tạo Học sinh 2
    cursor.execute(f"INSERT INTO students (full_name, parent_name, parent_phone, teacher_id) VALUES ('Trần Thị Bé', 'Chị Hoa', '0909000222', {teacher_id})")

    conn.commit()
    print(">>> Đã tạo Database mới và dữ liệu mẫu thành công!")
    cursor.close()
    conn.close()

except mysql.connector.Error as err:
    print(f"Lỗi: {err}")