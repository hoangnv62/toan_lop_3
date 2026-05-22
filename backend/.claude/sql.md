create table classes
(
    id         int auto_increment
        primary key,
    teacher_id int                                   not null,
    class_name varchar(100)                          not null,
    created_at timestamp default current_timestamp() not null
);

create table users
(
    id         int auto_increment
        primary key,
    username   varchar(50)                           not null,
    password   varchar(255)                          not null,
    full_name  varchar(100)                          not null,
    role       enum ('teacher', 'student')           not null,
    dob        date                                  null,
    class_id   int                                   null,
    created_at timestamp default current_timestamp() not null,
    constraint username
        unique (username),
    constraint fk_user_class
        foreign key (class_id) references classes (id)
            on delete set null
);

alter table classes
    add constraint fk_class_teacher
        foreign key (teacher_id) references users (id);

create table lessons
(
    id          int auto_increment
        primary key,
    teacher_id  int                                   not null,
    title       varchar(255)                          not null,
    description text                                  null,
    created_at  timestamp default current_timestamp() not null,
    constraint fk_lesson_teacher
        foreign key (teacher_id) references users (id)
);

create table exams
(
    id           int auto_increment
        primary key,
    lesson_id    int                                   not null,
    name         varchar(255)                          not null,
    description  text                                  null,
    date_created timestamp default current_timestamp() not null,
    constraint fk_exam_lesson
        foreign key (lesson_id) references lessons (id)
            on delete cascade
);

create table questions
(
    id          int auto_increment
        primary key,
    exam_id     int      not null,
    content     text     not null,
    svg_code    longtext null,
    explanation text     null,
    constraint fk_question_exam
        foreign key (exam_id) references exams (id)
            on delete cascade
);

create table answers
(
    id          int auto_increment
        primary key,
    question_id int                  not null,
    content     text                 not null,
    is_correct  tinyint(1) default 0 null,
    constraint fk_answer_question
        foreign key (question_id) references questions (id)
            on delete cascade
);

create table student_answers
(
    id           int auto_increment
        primary key,
    student_id   int                                   not null,
    exam_id      int                                   not null,
    answer_id    int                                   not null,
    time_spent   int       default 0                   null,
    submitted_at timestamp default current_timestamp() not null,
    constraint fk_student_answer_answer
        foreign key (answer_id) references answers (id)
            on delete cascade,
    constraint fk_student_answer_exam
        foreign key (exam_id) references exams (id)
            on delete cascade,
    constraint fk_student_answer_student
        foreign key (student_id) references users (id)
            on delete cascade
);

create table student_relatives
(
    id           int auto_increment
        primary key,
    student_id   int          not null,
    name         varchar(100) not null,
    phone        varchar(20)  not null,
    relationship varchar(50)  null,
    created_at   timestamp default current_timestamp() not null,
    constraint fk_relative_student
        foreign key (student_id) references users (id)
            on delete cascade
);

create table student_parents
(
    id           int auto_increment
        primary key,
    student_id   int          not null,
    parent_name  varchar(100) null,
    parent_phone varchar(20)  null,
    constraint parent_phone
        unique (parent_phone),
    constraint student_id
        unique (student_id),
    constraint fk_parent_student
        foreign key (student_id) references users (id)
            on delete cascade
);

-- Giao bài tập theo lớp (với deadline tùy chọn)
create table class_exams
(
    id          int auto_increment
        primary key,
    class_id    int                                   not null,
    exam_id     int                                   not null,
    deadline    datetime                              null,
    assigned_at timestamp default current_timestamp() not null,
    constraint uq_class_exam
        unique (class_id, exam_id),
    constraint fk_ce_class
        foreign key (class_id) references classes (id)
            on delete cascade,
    constraint fk_ce_exam
        foreign key (exam_id) references exams (id)
            on delete cascade
);

-- Nhận xét của giáo viên trên bài làm của học sinh
create table student_exam_comments
(
    id         int auto_increment
        primary key,
    exam_id    int                                   not null,
    student_id int                                   not null,
    teacher_id int                                   not null,
    comment    text                                  not null,
    created_at timestamp default current_timestamp() not null,
    constraint uq_sec
        unique (exam_id, student_id),
    constraint fk_sec_exam
        foreign key (exam_id) references exams (id)
            on delete cascade,
    constraint fk_sec_student
        foreign key (student_id) references users (id)
            on delete cascade,
    constraint fk_sec_teacher
        foreign key (teacher_id) references users (id)
            on delete cascade
);

-- Ngân hàng câu hỏi (câu hỏi độc lập, tái sử dụng được)
create table question_bank
(
    id          int auto_increment
        primary key,
    teacher_id  int                                   not null,
    content     text                                  not null,
    explanation text                                  null,
    created_at  timestamp default current_timestamp() not null,
    constraint fk_qb_teacher
        foreign key (teacher_id) references users (id)
            on delete cascade
);

create table question_bank_answers
(
    id          int auto_increment
        primary key,
    question_id int                  not null,
    content     text                 not null,
    is_correct  tinyint(1) default 0 not null,
    constraint fk_qba_question
        foreign key (question_id) references question_bank (id)
            on delete cascade
);

-- Thông báo của giáo viên gửi cho lớp
create table announcements
(
    id         int auto_increment
        primary key,
    class_id   int                                   not null,
    teacher_id int                                   not null,
    title      varchar(255)                          not null,
    content    text                                  not null,
    created_at timestamp default current_timestamp() not null,
    constraint fk_ann_class
        foreign key (class_id) references classes (id)
            on delete cascade,
    constraint fk_ann_teacher
        foreign key (teacher_id) references users (id)
            on delete cascade
);

-- Thêm thời gian mở bài vào class_exams
alter table class_exams
    add column open_time datetime null comment 'NULL = mở ngay, có giá trị = chỉ hiện sau thời điểm này';

-- Thêm giới hạn thời gian làm bài vào exams (cột cũ, không còn dùng để tạo bài)
alter table exams
    add column time_limit int null comment 'giây, NULL = không giới hạn';

-- Di chuyển time_limit sang class_exams (mỗi lớp có thể có thời gian làm bài khác nhau)
alter table class_exams
    add column time_limit int not null default 1200 comment 'giây, bắt buộc khi giao bài';
