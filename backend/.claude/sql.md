create table users
(
    id         int auto_increment primary key,
    username   varchar(50)              not null unique,
    password   varchar(255)             not null,
    full_name  varchar(100)             not null,
    role       enum('teacher','student') not null,
    dob        date,
    email      varchar(100),
    phone      varchar(20),
    class_id   int,
    created_at timestamp default current_timestamp()
);

create table classes
(
    id         int auto_increment primary key,
    teacher_id int          not null,
    class_name varchar(100) not null,
    created_at timestamp default current_timestamp(),
    foreign key (teacher_id) references users(id)
);

alter table users
    add constraint fk_user_class
        foreign key (class_id) references classes(id) on delete set null;

create table student_parents
(
    id           int auto_increment primary key,
    student_id   int unique not null,
    parent_name  varchar(100),
    parent_phone varchar(20) unique,
    foreign key (student_id) references users(id) on delete cascade
);

create table student_relatives
(
    id           int auto_increment primary key,
    student_id   int          not null,
    name         varchar(100) not null,
    phone        varchar(20)  not null,
    relationship varchar(50),
    created_at   timestamp default current_timestamp(),
    foreign key (student_id) references users(id) on delete cascade
);

create table lessons
(
    id          int auto_increment primary key,
    teacher_id  int          not null,
    title       varchar(255) not null,
    description text,
    created_at  timestamp default current_timestamp(),
    foreign key (teacher_id) references users(id)
);

create table exams
(
    id           int auto_increment primary key,
    lesson_id    int          not null,
    name         varchar(255) not null,
    description  text,
    date_created timestamp default current_timestamp(),
    foreign key (lesson_id) references lessons(id) on delete cascade
);

create table questions
(
    id          int auto_increment primary key,
    exam_id     int  not null,
    content     text not null,
    explanation text,
    foreign key (exam_id) references exams(id) on delete cascade
);

create table answers
(
    id          int auto_increment primary key,
    question_id int        not null,
    content     text       not null,
    is_correct  tinyint(1) default 0,
    foreign key (question_id) references questions(id) on delete cascade
);

create table student_answers
(
    id           int auto_increment primary key,
    student_id   int not null,
    exam_id      int not null,
    answer_id    int not null,
    time_spent   int default 0,
    submitted_at timestamp default current_timestamp(),
    foreign key (student_id) references users(id)   on delete cascade,
    foreign key (exam_id)    references exams(id)   on delete cascade,
    foreign key (answer_id)  references answers(id) on delete cascade
);

create table class_exams
(
    id          int auto_increment primary key,
    class_id    int not null,
    exam_id     int not null,
    deadline    datetime,
    open_time   datetime,
    time_limit  int not null default 1200,
    assigned_at timestamp default current_timestamp(),
    unique key uq_class_exam (class_id, exam_id),
    foreign key (class_id) references classes(id) on delete cascade,
    foreign key (exam_id)  references exams(id)   on delete cascade
);

create table student_exam_comments
(
    id         int auto_increment primary key,
    exam_id    int  not null,
    student_id int  not null,
    teacher_id int  not null,
    comment    text not null,
    created_at timestamp default current_timestamp(),
    unique key uq_sec (exam_id, student_id),
    foreign key (exam_id)    references exams(id) on delete cascade,
    foreign key (student_id) references users(id) on delete cascade,
    foreign key (teacher_id) references users(id) on delete cascade
);

create table announcements
(
    id         int auto_increment primary key,
    class_id   int          not null,
    teacher_id int          not null,
    title      varchar(255) not null,
    content    text         not null,
    created_at timestamp default current_timestamp(),
    foreign key (class_id)   references classes(id) on delete cascade,
    foreign key (teacher_id) references users(id)   on delete cascade
);

create table question_bank
(
    id          int auto_increment primary key,
    teacher_id  int  not null,
    lesson_id   int,
    content     text not null,
    explanation text,
    created_at  timestamp default current_timestamp(),
    foreign key (teacher_id) references users(id)    on delete cascade,
    foreign key (lesson_id)  references lessons(id)  on delete set null
);

create table question_bank_answers
(
    id          int auto_increment primary key,
    question_id int        not null,
    content     text       not null,
    is_correct  tinyint(1) default 0,
    foreign key (question_id) references question_bank(id) on delete cascade
);
