import { query, queryOne, insert } from '../config/database.js';

export const findByStudent = (studentId) =>
  query(
    'SELECT id, name, phone, relationship, created_at FROM student_relatives WHERE student_id = :sid ORDER BY created_at ASC',
    { sid: studentId }
  );

export const countByStudent = async (studentId) => {
  const row = await queryOne(
    'SELECT COUNT(*) AS cnt FROM student_relatives WHERE student_id = :sid',
    { sid: studentId }
  );
  return row?.cnt || 0;
};

export const findById = (id) =>
  queryOne('SELECT * FROM student_relatives WHERE id = :id', { id });

export const createRelative = (studentId, name, phone, relationship) =>
  insert(
    'INSERT INTO student_relatives (student_id, name, phone, relationship) VALUES (:studentId, :name, :phone, :relationship)',
    { studentId, name, phone, relationship: relationship || null }
  );

export const updateRelative = (id, name, phone, relationship) =>
  query(
    'UPDATE student_relatives SET name = :name, phone = :phone, relationship = :relationship WHERE id = :id',
    { name, phone, relationship: relationship || null, id }
  );

export const deleteRelative = (id) =>
  query('DELETE FROM student_relatives WHERE id = :id', { id });
