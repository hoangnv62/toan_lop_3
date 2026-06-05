import { query, queryOne } from '../config/database.js';

export const findById = (studentId) =>
  queryOne("SELECT * FROM users WHERE id = :id AND role = 'student'", { id: studentId });

export const addToClass = (studentId, classId) =>
  query('UPDATE users SET class_id = :classId WHERE id = :id', { classId, id: studentId });

export const removeFromClass = (studentId) =>
  query('UPDATE users SET class_id = NULL WHERE id = :id', { id: studentId });

export const getResults = (studentId) =>
  query(
    `SELECT e.id AS examId, e.name AS examName, l.title AS lessonName,
       ROUND(SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END)/NULLIF(COUNT(DISTINCT q.id),0)*10,1) AS score,
       MAX(sa.submitted_at) AS submittedAt
     FROM student_answers sa
     JOIN answers a ON sa.answer_id=a.id
     JOIN questions q ON a.question_id=q.id
     JOIN exams e ON sa.exam_id=e.id
     JOIN lessons l ON e.lesson_id=l.id
     WHERE sa.student_id=:sid
     GROUP BY sa.exam_id ORDER BY MAX(sa.submitted_at) DESC`,
    { sid: studentId }
  );

export const getProgress = (studentId) =>
  query(
    `SELECT e.name AS examName,
       ROUND(SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END)/NULLIF(COUNT(DISTINCT q.id),0)*10,1) AS score,
       MAX(sa.submitted_at) AS submittedAt
     FROM student_answers sa
     JOIN answers a ON sa.answer_id=a.id
     JOIN questions q ON a.question_id=q.id
     JOIN exams e ON sa.exam_id=e.id
     WHERE sa.student_id=:sid
     GROUP BY sa.exam_id ORDER BY MAX(sa.submitted_at) ASC`,
    { sid: studentId }
  );

export const getLessonsWithStats = async (studentId, dateFrom = null, dateTo = null) => {
  let sql = `
    SELECT l.id AS lesson_id, l.title AS lesson_name, l.created_at,
      e.id AS exam_id, e.name AS exam_name, e.date_created AS exam_created_at, ce.deadline, ce.open_time,
      CASE WHEN MAX(sa.id) IS NULL THEN 0 ELSE 1 END AS done,
      COUNT(DISTINCT q.id) AS total_questions,
      SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct_questions,
      MAX(sa.time_spent) AS time_spent
    FROM lessons l
    JOIN exams e ON e.lesson_id=l.id
    JOIN class_exams ce ON ce.exam_id=e.id
    LEFT JOIN student_answers sa ON sa.exam_id=e.id AND sa.student_id=:sid
    LEFT JOIN answers a ON sa.answer_id=a.id
    LEFT JOIN questions q ON a.question_id=q.id
    WHERE ce.class_id=(SELECT class_id FROM users WHERE id=:sid)
      AND (ce.open_time IS NULL OR ce.open_time <= NOW())
  `;
  const params = { sid: studentId };
  if (dateFrom) {
    sql += ' AND (sa.submitted_at >= :df OR sa.submitted_at IS NULL)';
    params.df = dateFrom;
  }
  if (dateTo) {
    const dt = new Date(dateTo);
    dt.setDate(dt.getDate() + 1);
    sql += ' AND (sa.submitted_at < :dt OR (sa.submitted_at IS NULL AND ce.assigned_at < :dt2))';
    params.dt = dt;
    params.dt2 = dt;
  }
  sql += ' GROUP BY l.id, e.id ORDER BY l.created_at DESC';
  return query(sql, params);
};

export const getClassRanking = async (teacherId, dateFrom = null, dateTo = null) => {
  let dtAdjusted = null;
  if (dateTo) {
    const dt = new Date(dateTo);
    dt.setDate(dt.getDate() + 1);
    dtAdjusted = dt;
  }
  return query(
    `SELECT u.id AS student_id, u.full_name AS student_name,
       COUNT(DISTINCT q.id) AS total_questions,
       COUNT(DISTINCT CASE WHEN a.is_correct = 1 THEN q.id END) AS correct_questions
     FROM users u
     LEFT JOIN student_answers sa ON sa.student_id = u.id
       AND (:dateFrom IS NULL OR sa.submitted_at >= :dateFrom)
       AND (:dateTo IS NULL OR sa.submitted_at < :dateTo)
     LEFT JOIN answers a ON sa.answer_id = a.id
     LEFT JOIN questions q ON q.id = a.question_id
     WHERE u.role = 'student'
       AND u.class_id IN (SELECT id FROM classes WHERE teacher_id = :tid)
     GROUP BY u.id, u.full_name
     ORDER BY correct_questions DESC`,
    { dateFrom: dateFrom || null, dateTo: dtAdjusted, tid: teacherId }
  );
};

export const getAnnouncementsForStudent = (studentId) =>
  query(
    `SELECT id, title, content, created_at FROM announcements
     WHERE class_id=(SELECT class_id FROM users WHERE id=:sid)
     ORDER BY created_at DESC LIMIT 3`,
    { sid: studentId }
  );

export const getTeacherInfoForStudent = (studentId) =>
  queryOne(
    `SELECT t.id AS teacher_id, t.full_name, t.email, t.phone
     FROM users s
     JOIN classes c ON s.class_id = c.id
     JOIN users t ON c.teacher_id = t.id
     WHERE s.id = :sid`,
    { sid: studentId }
  );
