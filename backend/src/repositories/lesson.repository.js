import { query, queryOne, insert } from '../config/database.js';

export const findById = (lessonId) =>
  queryOne('SELECT * FROM lessons WHERE id = :id', { id: lessonId });

export const findByTeacher = async (teacherId, q = '', page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const params = { tid: teacherId };
  let where = 'WHERE l.teacher_id = :tid';
  if (q) {
    where += ' AND l.title LIKE :q';
    params.q = `%${q}%`;
  }
  const totalRow = await queryOne(
    `SELECT COUNT(*) AS total FROM lessons l ${where}`,
    params
  );
  const total = totalRow?.total || 0;
  params.limit = limit;
  params.offset = offset;
  const items = await query(
    `SELECT l.*, COUNT(e.id) AS exam_count
     FROM lessons l
     LEFT JOIN exams e ON e.lesson_id = l.id
     ${where}
     GROUP BY l.id ORDER BY l.created_at DESC
     LIMIT :limit OFFSET :offset`,
    params
  );
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
};

export const findExamsByLesson = (lessonId) =>
  query(
    'SELECT id, name, description, date_created FROM exams WHERE lesson_id = :lessonId ORDER BY date_created DESC',
    { lessonId }
  );

export const createLesson = (teacherId, title) =>
  insert(
    "INSERT INTO lessons (teacher_id, title, description) VALUES (:teacherId, :title, '')",
    { teacherId, title }
  );

export const updateLesson = (lessonId, title) =>
  query('UPDATE lessons SET title = :title WHERE id = :id', { title, id: lessonId });

export const deleteLesson = (lessonId) =>
  query('DELETE FROM lessons WHERE id = :id', { id: lessonId });
