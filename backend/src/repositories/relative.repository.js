import { query, queryOne, insert } from '../config/database.js';

export const findByStudent = (studentId) =>
  query(
    'SELECT id, name, phone, email, relationship, created_at FROM student_relatives WHERE student_id = :sid ORDER BY created_at ASC',
    { sid: studentId }
  );

export const countByStudent = async (studentId) => {
  const row = await queryOne(
    'SELECT COUNT(*) AS cnt FROM student_relatives WHERE student_id = :sid',
    { sid: studentId }
  );
  return row?.cnt || 0;
};

export const isStudentOfTeacher = async (studentId, teacherId) => {
  const row = await queryOne(
    `SELECT 1 AS ok FROM users u
     JOIN classes c ON c.id = u.class_id
     WHERE u.id = :sid AND u.role = 'student' AND c.teacher_id = :tid`,
    { sid: studentId, tid: teacherId }
  );
  return !!row;
};

export const findById = (id) =>
  queryOne('SELECT * FROM student_relatives WHERE id = :id', { id });

export const createRelative = (studentId, name, phone, email, relationship) =>
  insert(
    'INSERT INTO student_relatives (student_id, name, phone, email, relationship) VALUES (:studentId, :name, :phone, :email, :relationship)',
    { studentId, name, phone, email: email || null, relationship: relationship || null }
  );

export const updateRelative = (id, name, phone, email, relationship) =>
  query(
    'UPDATE student_relatives SET name = :name, phone = :phone, email = :email, relationship = :relationship WHERE id = :id',
    { name, phone, email: email || null, relationship: relationship || null, id }
  );

export const deleteRelative = (id) =>
  query('DELETE FROM student_relatives WHERE id = :id', { id });

export const getEmailsByClassId = (classId) =>
  query(
    `SELECT sr.email, sr.name AS relative_name, u.full_name AS student_name
     FROM student_relatives sr
     JOIN users u ON u.id = sr.student_id
     WHERE u.class_id = :classId
       AND u.role = 'student'
       AND sr.email IS NOT NULL
       AND sr.email != ''`,
    { classId }
  );
