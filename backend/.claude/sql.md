create table answers
(
    id          int auto_increment
        primary key,
    questionId  int        not null,
    content     int        not null,
    isCorrected tinyint(1) not null
)
    collate = utf8mb4_general_ci;

create table exams
(
    id           int auto_increment
        primary key,
    lesson_id    int                                not null,
    name         text                               not null,
    description  text                               not null,
    date_created datetime default CURRENT_TIMESTAMP not null
)
    collate = utf8mb4_general_ci;

create table questions
(
    id          int auto_increment
        primary key,
    exam_id     int                          not null,
    content     text                         not null,
    svg_code    longtext                     null,
    options     longtext collate utf8mb4_bin null,
    explanation text                         null,
    check (json_valid(`options`))
)
    collate = utf8mb4_general_ci;

create index exam_set_id
    on questions (exam_id);

create table student_answer
(
    id         int auto_increment
        primary key,
    exam_id    int not null,
    answer_id  int not null,
    user_id    int not null,
    time_spent int not null
)
    collate = utf8mb4_general_ci;

create table teachers
(
    id        int auto_increment
        primary key,
    username  varchar(50)  null,
    password  varchar(50)  null,
    full_name varchar(100) null,
    constraint username
        unique (username)
)
    collate = utf8mb4_general_ci;

create table classes
(
    id         int auto_increment
        primary key,
    teacher_id int                                 not null,
    class_name varchar(100)                        not null,
    created_at timestamp default CURRENT_TIMESTAMP not null,
    constraint classes_ibfk_1
        foreign key (teacher_id) references teachers (id)
            on delete cascade
)
    collate = utf8mb4_general_ci;

create index teacher_id
    on classes (teacher_id);

create table lessons
(
    id          int auto_increment
        primary key,
    teacher_id  int                                 null,
    title       varchar(255)                        null,
    description text                                null,
    created_at  timestamp default CURRENT_TIMESTAMP not null,
    constraint lessons_ibfk_1
        foreign key (teacher_id) references teachers (id)
)
    collate = utf8mb4_general_ci;

create table exam_sets
(
    id         int auto_increment
        primary key,
    lesson_id  int                                                   not null,
    title      varchar(255)                                          null,
    status     enum ('draft', 'published') default 'draft'           null,
    created_at timestamp                   default CURRENT_TIMESTAMP not null,
    constraint exam_sets_ibfk_1
        foreign key (lesson_id) references lessons (id)
            on delete cascade
)
    collate = utf8mb4_general_ci;

create index lesson_id
    on exam_sets (lesson_id);

create index teacher_id
    on lessons (teacher_id);

create table students
(
    id           int auto_increment
        primary key,
    full_name    varchar(100)                       null,
    parent_name  varchar(100)                       null,
    parent_phone varchar(20)                        null,
    teacher_id   int                                null,
    class_id     int                                not null,
    dob          datetime default CURRENT_TIMESTAMP null,
    password     text                               not null,
    constraint parent_phone
        unique (parent_phone),
    constraint students_ibfk_1
        foreign key (teacher_id) references teachers (id)
)
    collate = utf8mb4_general_ci;

create index teacher_id
    on students (teacher_id);

