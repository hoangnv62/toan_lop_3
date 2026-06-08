import { query, queryOne, insert } from '../config/database.js';

export const findById = (classId) =>
  queryOne('SELECT * FROM classes WHERE id = :id', { id: classId });

export const findByIdAndTeacher = (classId, teacherId) =>
  queryOne('SELECT * FROM classes WHERE id = :id AND teacher_id = :tid', { id: classId, tid: teacherId });

export const findByTeacherWithStats = async (teacherId, page = 1, limit = 12) => {
  const offset = (page - 1) * limit;
  const totalRow = await queryOne(
    'SELECT COUNT(*) AS total FROM classes WHERE teacher_id = :tid',
    { tid: teacherId }
  );
  const total = totalRow?.total || 0;
  const items = await query(
    `SELECT c.id AS classId, c.class_name AS className,
       COUNT(DISTINCT u.id) AS totalStudents,
       COUNT(sa.id) AS totalAnswers,
       SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correctAnswers
     FROM classes c
     LEFT JOIN users u ON u.class_id=c.id AND u.role='student'
     LEFT JOIN student_answers sa ON sa.student_id=u.id
     LEFT JOIN answers a ON a.id=sa.answer_id
     WHERE c.teacher_id=:tid
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT :limit OFFSET :offset`,
    { tid: teacherId, limit, offset }
  );
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
};

export const getStudentsWithAvg = async (classId, page = 1, limit = 15) => {
  const offset = (page - 1) * limit;
  const totalRow = await queryOne(
    "SELECT COUNT(*) AS total FROM users WHERE class_id = :cid AND role = 'student'",
    { cid: classId }
  );
  const total = totalRow?.total || 0;
  const items = await query(
    `SELECT u.id, u.username, u.full_name, u.dob,
       ROUND(AVG(exam_score), 2) AS avg_score
     FROM users u
     LEFT JOIN (
       SELECT sa.student_id, sa.exam_id,
         SUM(a.is_correct) / NULLIF(COUNT(sa.id),0) * 10 AS exam_score
       FROM student_answers sa
       JOIN answers a ON a.id=sa.answer_id
       GROUP BY sa.student_id, sa.exam_id
     ) t ON t.student_id=u.id
     WHERE u.class_id=:cid AND u.role='student'
     GROUP BY u.id
     LIMIT :limit OFFSET :offset`,
    { cid: classId, limit, offset }
  );
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
};

export const getStudentsWithScores = (classId) =>
  query(
    `SELECT u.id, u.full_name AS name,
       ROUND(
         SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) * 10.0
         / NULLIF(COUNT(DISTINCT q.id), 0)
       , 2) AS avg_score
     FROM users u
     LEFT JOIN student_answers sa ON sa.student_id=u.id
     LEFT JOIN answers a ON sa.answer_id=a.id
     LEFT JOIN questions q ON a.question_id=q.id
     WHERE u.class_id=:cid AND u.role='student'
     GROUP BY u.id ORDER BY u.full_name`,
    { cid: classId }
  );

export const getClassAvg = async (classId) => {
  const row = await queryOne(
    `SELECT ROUND(AVG(student_avg), 2) AS class_avg
     FROM (
       SELECT u.id, AVG(t.exam_score) AS student_avg
       FROM users u
       JOIN (
         SELECT sa.student_id, sa.exam_id,
           SUM(a.is_correct) / NULLIF(COUNT(sa.id), 0) * 10 AS exam_score
         FROM student_answers sa
         JOIN answers a ON a.id = sa.answer_id
         GROUP BY sa.student_id, sa.exam_id
       ) t ON t.student_id = u.id
       WHERE u.class_id = :cid AND u.role = 'student'
       GROUP BY u.id
     ) sub`,
    { cid: classId }
  );
  return row?.class_avg != null ? parseFloat(row.class_avg) : null;
};

export const getStudentsForExport = (classId) =>
  query(
    `SELECT u.username, u.full_name, u.dob,
       ROUND(AVG(CASE WHEN a.is_correct=1 THEN 10.0 ELSE 0 END), 2) AS avg_score,
       COUNT(DISTINCT sa.exam_id) AS total_exams
     FROM users u
     LEFT JOIN student_answers sa ON sa.student_id=u.id
     LEFT JOIN answers a ON sa.answer_id=a.id
     WHERE u.class_id=:cid AND u.role='student'
     GROUP BY u.id ORDER BY u.full_name`,
    { cid: classId }
  );

export const createClass = (teacherId, className) =>
  insert(
    'INSERT INTO classes (teacher_id, class_name) VALUES (:teacherId, :className)',
    { teacherId, className }
  );

export const updateClass = (classId, className) =>
  query('UPDATE classes SET class_name = :className WHERE id = :id', { className, id: classId });

export const deleteClass = async (classId) => {
  await query("UPDATE users SET class_id = NULL WHERE class_id = :cid AND role = 'student'", { cid: classId });
  await query('DELETE FROM classes WHERE id = :id', { id: classId });
};

export const findClassExamByClassAndExam = (classId, examId) =>
  queryOne('SELECT * FROM class_exams WHERE class_id = :classId AND exam_id = :examId', { classId, examId });

export const findClassExamsByClass = (classId) =>
  query(
    `SELECT ce.exam_id, e.name AS exam_name, l.title AS lesson_name,
       ce.deadline, ce.assigned_at, ce.open_time, ce.time_limit,
       COUNT(DISTINCT sa.student_id) AS completed_count,
       (SELECT COUNT(*) FROM users WHERE class_id=:cid AND role='student') AS total_students
     FROM class_exams ce
     JOIN exams e ON ce.exam_id=e.id
     JOIN lessons l ON e.lesson_id=l.id
     LEFT JOIN student_answers sa
       ON sa.exam_id=ce.exam_id
       AND sa.student_id IN (SELECT id FROM users WHERE class_id=:cid AND role='student')
     WHERE ce.class_id=:cid
     GROUP BY ce.exam_id, e.name, l.title, ce.deadline, ce.assigned_at, ce.open_time, ce.time_limit
     ORDER BY ce.assigned_at DESC`,
    { cid: classId }
  );

export const findClassExamsByExamAndTeacher = (examId, teacherId) =>
  query(
    `SELECT c.id AS class_id, c.class_name,
       (ce.exam_id IS NOT NULL) AS assigned,
       ce.deadline, ce.assigned_at, ce.open_time, ce.time_limit
     FROM classes c
     LEFT JOIN class_exams ce ON ce.class_id=c.id AND ce.exam_id=:eid
     WHERE c.teacher_id=:tid
     ORDER BY c.class_name`,
    { eid: examId, tid: teacherId }
  );

export const findClassExamForStudent = (studentId, examId) =>
  queryOne(
    `SELECT ce.time_limit FROM class_exams ce
     JOIN users u ON u.class_id = ce.class_id
     WHERE ce.exam_id = :eid AND u.id = :sid`,
    { eid: examId, sid: studentId }
  );

export const assignExam = (classId, examId, deadline, openTime, timeLimit) =>
  query(
    'INSERT INTO class_exams (class_id, exam_id, deadline, open_time, time_limit) VALUES (:classId, :examId, :deadline, :openTime, :timeLimit)',
    { classId, examId, deadline: deadline || null, openTime: openTime || null, timeLimit }
  );

export const updateExamAssignment = (classId, examId, deadline, openTime, timeLimit) =>
  query(
    'UPDATE class_exams SET deadline = :deadline, open_time = :openTime, time_limit = :timeLimit WHERE class_id = :classId AND exam_id = :examId',
    { deadline: deadline || null, openTime: openTime || null, timeLimit, classId, examId }
  );

export const unassignExam = (classId, examId) =>
  query('DELETE FROM class_exams WHERE class_id = :classId AND exam_id = :examId', { classId, examId });

export const findAnnouncementsByClass = (classId) =>
  query(
    'SELECT id, title, content, created_at FROM announcements WHERE class_id = :cid ORDER BY created_at DESC',
    { cid: classId }
  );

export const findAnnouncementByIdAndTeacher = (annId, teacherId) =>
  queryOne('SELECT * FROM announcements WHERE id = :id AND teacher_id = :tid', { id: annId, tid: teacherId });

export const createAnnouncement = (classId, teacherId, title, content) =>
  insert(
    'INSERT INTO announcements (class_id, teacher_id, title, content) VALUES (:classId, :teacherId, :title, :content)',
    { classId, teacherId, title, content }
  );

export const deleteAnnouncement = (annId) =>
  query('DELETE FROM announcements WHERE id = :id', { id: annId });

export const getClassInfo = (classId) =>
  queryOne(
    `SELECT c.class_name, u.full_name AS teacher_name
     FROM classes c
     JOIN users u ON u.id = c.teacher_id
     WHERE c.id = :classId`,
    { classId }
  );
