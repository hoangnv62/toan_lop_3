import { query, queryOne, transaction } from '../config/database.js';

const ATTEMPT_COLUMNS = 'id, student_id, exam_id, started_at, time_limit, submitted_at';

export const findAttempt = (studentId, examId) =>
  queryOne(
    `SELECT ${ATTEMPT_COLUMNS} FROM exam_attempts
     WHERE student_id = :studentId AND exam_id = :examId`,
    { studentId, examId }
  );

// INSERT IGNORE: 2 tab mở đề cùng lúc thì chỉ một lượt được tạo, tab kia đọc lại đúng lượt đó.
export const createAttempt = async (studentId, examId, timeLimit) => {
  await query(
    `INSERT IGNORE INTO exam_attempts (student_id, exam_id, time_limit)
     VALUES (:studentId, :examId, :timeLimit)`,
    { studentId, examId, timeLimit }
  );
  return findAttempt(studentId, examId);
};

export const findSavedAnswers = (attemptId) =>
  query(
    'SELECT question_id, answer_id FROM exam_attempt_answers WHERE attempt_id = :attemptId',
    { attemptId }
  );

export const saveAnswer = (attemptId, questionId, answerId) =>
  query(
    `INSERT INTO exam_attempt_answers (attempt_id, question_id, answer_id)
     VALUES (:attemptId, :questionId, :answerId)
     ON DUPLICATE KEY UPDATE answer_id = VALUES(answer_id)`,
    { attemptId, questionId, answerId }
  );

// Lượt chưa nộp đã quá giờ + graceSeconds. Lọc theo học sinh / đề nếu có.
export const findExpiredOpenAttempts = (graceSeconds, { studentId = null, examId = null } = {}) =>
  query(
    `SELECT id FROM exam_attempts
     WHERE submitted_at IS NULL
       AND started_at + INTERVAL (time_limit + :graceSeconds) SECOND < NOW()
       AND (:studentId IS NULL OR student_id = :studentId)
       AND (:examId IS NULL OR exam_id = :examId)`,
    { graceSeconds, studentId, examId }
  );

// Chấm và chốt một lượt làm bài theo các đáp án đã lưu: ghi student_answers (bảng kết quả cũ mà
// thống kê / kết quả / Excel đang đọc) rồi đánh dấu submitted_at. Khóa dòng (FOR UPDATE) để nộp
// tay và tự chấm khi hết giờ chạy cùng lúc không chấm 2 lần. null = lượt đã được chốt trước đó.
// Thời gian làm bài do server tính, tối đa bằng time_limit.
export const finalizeAttempt = (attemptId) =>
  transaction(async (conn) => {
    const [attempt] = await conn.query(
      `SELECT ${ATTEMPT_COLUMNS},
         LEAST(TIMESTAMPDIFF(SECOND, started_at, NOW()), time_limit) AS time_spent
       FROM exam_attempts WHERE id = :attemptId FOR UPDATE`,
      { attemptId }
    );
    if (!attempt || attempt.submitted_at) return null;

    const saved = await conn.query(
      'SELECT answer_id FROM exam_attempt_answers WHERE attempt_id = :attemptId',
      { attemptId }
    );
    const correctIds = new Set((await conn.query(
      `SELECT a.id FROM answers a JOIN questions q ON q.id = a.question_id
       WHERE q.exam_id = :examId AND a.is_correct = 1`,
      { examId: attempt.exam_id }
    )).map(r => Number(r.id)));
    const [{ total }] = await conn.query(
      'SELECT COUNT(*) AS total FROM questions WHERE exam_id = :examId',
      { examId: attempt.exam_id }
    );

    for (const { answer_id } of saved) {
      await conn.query(
        `INSERT INTO student_answers (student_id, exam_id, answer_id, time_spent)
         VALUES (:studentId, :examId, :answerId, :timeSpent)`,
        {
          studentId: attempt.student_id, examId: attempt.exam_id,
          answerId: answer_id, timeSpent: attempt.time_spent,
        }
      );
    }
    await conn.query(
      'UPDATE exam_attempts SET submitted_at = NOW() WHERE id = :attemptId',
      { attemptId }
    );

    const correct = saved.filter(r => correctIds.has(Number(r.answer_id))).length;
    return {
      score: total ? parseFloat((correct / total * 10).toFixed(1)) : 0,
      correct,
      total: Number(total),
      timeSpent: Number(attempt.time_spent),
      answered: saved.length,
    };
  });
