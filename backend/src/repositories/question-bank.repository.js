import { query, queryOne, insert, transaction } from '../config/database.js';
import { formatDate } from '../utils/date.utils.js';

export const findByTeacher = async (teacherId, q = '', page = 1, limit = 10, lessonId = undefined) => {
  const offset = (page - 1) * limit;
  const params = { tid: teacherId };
  let where = 'WHERE teacher_id = :tid';
  if (q) {
    where += ' AND content LIKE :q';
    params.q = `%${q}%`;
  }
  if (lessonId === 0) {
    where += ' AND lesson_id IS NULL';
  } else if (lessonId != null) {
    where += ' AND lesson_id = :lessonId';
    params.lessonId = lessonId;
  }
  const totalRow = await queryOne(
    `SELECT COUNT(*) AS total FROM question_bank ${where}`,
    params
  );
  const total = totalRow?.total || 0;
  params.limit = limit;
  params.offset = offset;
  const rows = await query(
    `SELECT id, content, explanation, lesson_id, created_at FROM question_bank ${where}
     ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
    params
  );
  const items = [];
  for (const row of rows) {
    const answerRows = await query(
      'SELECT id, content, is_correct FROM question_bank_answers WHERE question_id = :qid ORDER BY id',
      { qid: row.id }
    );
    items.push({
      id: row.id,
      content: row.content,
      explanation: row.explanation,
      lessonId: row.lesson_id ?? null,
      createdAt: formatDate(row.created_at),
      answers: answerRows.map(a => ({
        id: a.id,
        content: a.content,
        isCorrect: a.is_correct === 1 || a.is_correct === true,
      })),
    });
  }
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
};

export const findById = (id) =>
  queryOne('SELECT * FROM question_bank WHERE id = :id', { id });

export const createQuestion = async (teacherId, content, explanation, answersData, lessonId = null) => {
  return transaction(async (conn) => {
    const result = await conn.query(
      'INSERT INTO question_bank (teacher_id, content, explanation, lesson_id) VALUES (:tid, :content, :explanation, :lessonId)',
      { tid: teacherId, content, explanation: explanation || null, lessonId }
    );
    const qId = result.insertId;
    for (const a of answersData) {
      await conn.query(
        'INSERT INTO question_bank_answers (question_id, content, is_correct) VALUES (:qId, :content, :isCorrect)',
        { qId, content: a.content || '', isCorrect: a.isCorrect ? 1 : 0 }
      );
    }
    return qId;
  });
};

export const updateQuestion = async (id, content, explanation, answersData, lessonId = null) => {
  return transaction(async (conn) => {
    await conn.query(
      'UPDATE question_bank SET content = :content, explanation = :explanation, lesson_id = :lessonId WHERE id = :id',
      { content, explanation: explanation || null, lessonId, id }
    );
    await conn.query('DELETE FROM question_bank_answers WHERE question_id = :id', { id });
    for (const a of answersData) {
      await conn.query(
        'INSERT INTO question_bank_answers (question_id, content, is_correct) VALUES (:qId, :content, :isCorrect)',
        { qId: id, content: a.content || '', isCorrect: a.isCorrect ? 1 : 0 }
      );
    }
  });
};

export const bulkCreate = async (teacherId, questionsData, lessonId = null) => {
  return transaction(async (conn) => {
    let count = 0;
    for (const qd of questionsData) {
      const result = await conn.query(
        'INSERT INTO question_bank (teacher_id, content, explanation, lesson_id) VALUES (:tid, :content, :explanation, :lessonId)',
        { tid: teacherId, content: qd.questionContent, explanation: qd.explanation || null, lessonId }
      );
      const qId = result.insertId;
      for (const a of (qd.answers || [])) {
        await conn.query(
          'INSERT INTO question_bank_answers (question_id, content, is_correct) VALUES (:qId, :content, :isCorrect)',
          { qId, content: a.content || '', isCorrect: a.isCorrected ? 1 : 0 }
        );
      }
      count++;
    }
    return count;
  });
};

export const deleteQuestion = (id) =>
  query('DELETE FROM question_bank WHERE id = :id', { id });
