import { query, queryOne, insert } from '../config/database.js';

export const findById = (id) =>
  queryOne('SELECT * FROM users WHERE id = :id', { id });

export const findByUsername = (username) =>
  queryOne('SELECT * FROM users WHERE username = :username', { username });

export const findByUsernameAndRole = (username, role) =>
  queryOne('SELECT * FROM users WHERE username = :username AND role = :role', { username, role });

export const create = async (username, password, fullName, role, dob = null) => {
  const id = await insert(
    'INSERT INTO users (username, password, full_name, role, dob) VALUES (:username, :password, :fullName, :role, :dob)',
    { username, password, fullName, role, dob }
  );
  return { id, username, full_name: fullName, role, dob };
};

export const updatePassword = (userId, hashed) =>
  query('UPDATE users SET password = :hashed WHERE id = :id', { hashed, id: userId });

export const getProfile = (userId) =>
  queryOne(
    'SELECT username, full_name, dob, email, phone FROM users WHERE id = :id',
    { id: userId }
  );

export const updateProfile = (userId, fullName, dob, email, phone) =>
  query(
    'UPDATE users SET full_name = :fullName, dob = :dob, email = :email, phone = :phone WHERE id = :id',
    { fullName, dob: dob || null, email: email || null, phone: phone || null, id: userId }
  );

export const searchStudents = (q, limit = 20) =>
  query(
    `SELECT u.id, u.username, u.full_name, u.dob, u.class_id, c.class_name AS current_class
     FROM users u
     LEFT JOIN classes c ON c.id = u.class_id
     WHERE u.role = 'student' AND u.username LIKE :q
     LIMIT :lim`,
    { q: `%${q}%`, lim: limit }
  );
