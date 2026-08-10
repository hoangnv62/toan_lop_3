import { query, queryOne, insert, transaction } from '../config/database.js';

export const findById = (examId) =>
  queryOne('SELECT * FROM exams WHERE id = :id', { id: examId });

export const findByIdWithTeacher = (examId, teacherId) =>
  queryOne(
    `SELECT e.* FROM exams e
     JOIN lessons l ON e.lesson_id = l.id
     WHERE e.id = :examId AND l.teacher_id = :teacherId`,
    { examId, teacherId }
  );

// Danh sách đề của giáo viên kèm số câu hỏi và các lớp đã được giao. Lọc theo
// lessons.teacher_id nên không trả về đề của giáo viên khác.
// Một câu JOIN thay vì lặp findExamsByLesson theo từng bài học — xem quy tắc
// tránh N+1 trong .claude/rules/database.md.
export const findByTeacher = (teacherId, lessonId = null) =>
  query(
    `SELECT e.id, e.name, e.description, e.date_created,
            l.id AS lesson_id, l.title AS lesson_title,
            COUNT(DISTINCT q.id) AS question_count,
            GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.class_name) AS assigned_classes
     FROM exams e
     JOIN lessons l ON l.id = e.lesson_id
     LEFT JOIN questions q ON q.exam_id = e.id
     LEFT JOIN class_exams ce ON ce.exam_id = e.id
     LEFT JOIN classes c ON c.id = ce.class_id
     WHERE l.teacher_id = :teacherId
       AND (:lessonId IS NULL OR e.lesson_id = :lessonId)
     GROUP BY e.id, l.id
     ORDER BY e.date_created DESC
     LIMIT 100`,
    { teacherId, lessonId }
  );

export const findWithQuestions = async (examId) => {
  const exam = await queryOne('SELECT * FROM exams WHERE id = :id', { id: examId });
  if (!exam) return null;
  const questions = await query(
    'SELECT id, content, explanation FROM questions WHERE exam_id = :examId ORDER BY id',
    { examId }
  );
  const answerRows = await query(
    `SELECT id, content, is_correct, question_id FROM answers
     WHERE question_id IN (SELECT id FROM questions WHERE exam_id = :examId)
     ORDER BY question_id, id`,
    { examId }
  );
  const answersByQuestion = {};
  for (const a of answerRows) {
    const qid = Number(a.question_id);
    if (!answersByQuestion[qid]) answersByQuestion[qid] = [];
    answersByQuestion[qid].push({ id: a.id, content: a.content, is_correct: a.is_correct });
  }
  for (const q of questions) {
    q.answers = answersByQuestion[Number(q.id)] || [];
  }
  exam.questions = questions;
  return exam;
};

export const createExam = async (lessonId, name, description, questionsData) => {
  return transaction(async (conn) => {
    const examResult = await conn.query(
      'INSERT INTO exams (lesson_id, name, description) VALUES (:lessonId, :name, :description)',
      { lessonId, name, description }
    );
    const examId = examResult.insertId;
    for (const qd of questionsData) {
      const qResult = await conn.query(
        'INSERT INTO questions (exam_id, content, explanation) VALUES (:examId, :content, :explanation)',
        { examId, content: qd.questionContent, explanation: qd.explanation || null }
      );
      const qId = qResult.insertId;
      for (const ad of (qd.answers || [])) {
        await conn.query(
          'INSERT INTO answers (question_id, content, is_correct) VALUES (:qId, :content, :isCorrect)',
          { qId, content: ad.content, isCorrect: ad.isCorrected ? 1 : 0 }
        );
      }
    }
    return examId;
  });
};

export const updateExam = async (examId, name, description, questionsData) => {
  return transaction(async (conn) => {
    await conn.query(
      'UPDATE exams SET name = :name, description = :description WHERE id = :id',
      { name, description, id: examId }
    );

    const existingQs = await conn.query(
      'SELECT id FROM questions WHERE exam_id = :examId',
      { examId }
    );
    const existingQIdList = existingQs.map(r => Number(r.id));
    const existingQIds = new Set(existingQIdList);
    const clientQIds = new Set();

    const existingAsByQuestion = {};
    if (existingQIdList.length) {
      const qParams = {};
      existingQIdList.forEach((id, i) => { qParams[`qid${i}`] = id; });
      const qPlaceholders = existingQIdList.map((_, i) => `:qid${i}`).join(',');
      const allExistingAs = await conn.query(
        `SELECT id, question_id FROM answers WHERE question_id IN (${qPlaceholders})`,
        qParams
      );
      for (const a of allExistingAs) {
        const qid = Number(a.question_id);
        if (!existingAsByQuestion[qid]) existingAsByQuestion[qid] = new Set();
        existingAsByQuestion[qid].add(Number(a.id));
      }
    }

    const staleAIds = [];

    for (const qd of questionsData) {
      let qId = qd.questionId;
      if (qId) {
        await conn.query(
          'UPDATE questions SET content = :content, explanation = :explanation WHERE id = :id',
          { content: qd.questionContent, explanation: qd.explanation || null, id: qId }
        );
      } else {
        const qResult = await conn.query(
          'INSERT INTO questions (exam_id, content, explanation) VALUES (:examId, :content, :explanation)',
          { examId, content: qd.questionContent, explanation: qd.explanation || null }
        );
        qId = qResult.insertId;
      }
      clientQIds.add(Number(qId));

      const existingAIds = existingAsByQuestion[Number(qId)] || new Set();
      const clientAIds = new Set();

      for (const ad of (qd.answers || [])) {
        let aId = ad.answerId;
        if (aId) {
          await conn.query(
            'UPDATE answers SET content = :content, is_correct = :isCorrect WHERE id = :id',
            { content: ad.content, isCorrect: ad.isCorrected ? 1 : 0, id: aId }
          );
        } else {
          const aResult = await conn.query(
            'INSERT INTO answers (question_id, content, is_correct) VALUES (:qId, :content, :isCorrect)',
            { qId, content: ad.content, isCorrect: ad.isCorrected ? 1 : 0 }
          );
          aId = aResult.insertId;
        }
        clientAIds.add(Number(aId));
      }

      for (const staleA of existingAIds) {
        if (!clientAIds.has(staleA)) staleAIds.push(staleA);
      }
    }

    if (staleAIds.length) {
      const aParams = {};
      staleAIds.forEach((id, i) => { aParams[`aid${i}`] = id; });
      const aPlaceholders = staleAIds.map((_, i) => `:aid${i}`).join(',');
      await conn.query(`DELETE FROM answers WHERE id IN (${aPlaceholders})`, aParams);
    }

    const staleQIds = [...existingQIds].filter(id => !clientQIds.has(id));
    if (staleQIds.length) {
      const sqParams = {};
      staleQIds.forEach((id, i) => { sqParams[`sqid${i}`] = id; });
      const sqPlaceholders = staleQIds.map((_, i) => `:sqid${i}`).join(',');
      await conn.query(`DELETE FROM questions WHERE id IN (${sqPlaceholders})`, sqParams);
    }
  });
};

export const deleteExam = (examId) =>
  query('DELETE FROM exams WHERE id = :id', { id: examId });

export const cloneExam = async (examId) => {
  return transaction(async (conn) => {
    const exam = await conn.query('SELECT * FROM exams WHERE id = :id', { id: examId });
    const src = exam[0];
    const newExamResult = await conn.query(
      'INSERT INTO exams (lesson_id, name, description) VALUES (:lessonId, :name, :description)',
      { lessonId: src.lesson_id, name: `${src.name} (Bản sao)`, description: src.description }
    );
    const newExamId = newExamResult.insertId;

    const questions = await conn.query('SELECT * FROM questions WHERE exam_id = :id ORDER BY id', { id: examId });
    if (!questions.length) return newExamId;

    const qIds = questions.map(q => Number(q.id));
    const cloneParams = {};
    qIds.forEach((id, i) => { cloneParams[`cqid${i}`] = id; });
    const clonePlaceholders = qIds.map((_, i) => `:cqid${i}`).join(',');
    const allAnswers = await conn.query(
      `SELECT question_id, content, is_correct FROM answers WHERE question_id IN (${clonePlaceholders}) ORDER BY id`,
      cloneParams
    );
    const answersByQId = {};
    for (const a of allAnswers) {
      const qid = Number(a.question_id);
      if (!answersByQId[qid]) answersByQId[qid] = [];
      answersByQId[qid].push(a);
    }

    for (const q of questions) {
      const newQResult = await conn.query(
        'INSERT INTO questions (exam_id, content, explanation) VALUES (:examId, :content, :explanation)',
        { examId: newExamId, content: q.content, explanation: q.explanation }
      );
      const newQId = newQResult.insertId;
      const answers = answersByQId[Number(q.id)] || [];
      for (const a of answers) {
        await conn.query(
          'INSERT INTO answers (question_id, content, is_correct) VALUES (:qId, :content, :isCorrect)',
          { qId: newQId, content: a.content, isCorrect: a.is_correct }
        );
      }
    }
    return newExamId;
  });
};

export const getExamResult = async (examId, studentId) => {
  const examInfo = await queryOne(
    `SELECT e.name AS exam_name, l.title AS lesson_name,
       MAX(sa.time_spent) AS time_spent,
       MAX(sa.submitted_at) AS submitted_at
     FROM exams e
     JOIN lessons l ON e.lesson_id=l.id
     LEFT JOIN student_answers sa ON sa.exam_id=e.id AND sa.student_id=:sid
     WHERE e.id=:eid GROUP BY e.id`,
    { eid: examId, sid: studentId }
  );
  if (!examInfo) return null;

  const rows = await query(
    `SELECT q.id AS question_id, q.content AS question_content, q.explanation,
       a.id AS answer_id, a.content AS answer_content,
       a.is_correct, sa.answer_id AS student_answer_id
     FROM questions q
     JOIN answers a ON a.question_id=q.id
     LEFT JOIN student_answers sa ON sa.answer_id=a.id AND sa.student_id=:sid AND sa.exam_id=:eid
     WHERE q.exam_id=:eid ORDER BY q.id, a.id`,
    { sid: studentId, eid: examId }
  );

  const questionMap = {};
  for (const r of rows) {
    const qid = r.question_id;
    if (!questionMap[qid]) {
      questionMap[qid] = {
        questionId: qid,
        questionContent: r.question_content,
        explanation: r.explanation,
        isCorrect: false,
        selectedAnswerId: null,
        answers: [],
      };
    }
    const ans = {
      answerId: r.answer_id,
      content: r.answer_content,
      isCorrected: r.is_correct,
      isSelected: r.student_answer_id == r.answer_id,
    };
    if (ans.isSelected) questionMap[qid].selectedAnswerId = r.answer_id;
    questionMap[qid].answers.push(ans);
  }

  const questions = Object.values(questionMap);
  let correctCount = 0;
  for (const q of questions) {
    const correctAns = q.answers.find(a => a.isCorrected == 1);
    q.isCorrect = correctAns != null && q.selectedAnswerId == correctAns.answerId;
    if (q.isCorrect) correctCount++;
  }
  const score = questions.length ? parseFloat((correctCount / questions.length * 10).toFixed(1)) : 0;

  const cmt = await queryOne(
    'SELECT comment FROM student_exam_comments WHERE exam_id = :eid AND student_id = :sid',
    { eid: examId, sid: studentId }
  );

  return {
    examName: examInfo.exam_name,
    lessonName: examInfo.lesson_name,
    timeSpent: examInfo.time_spent || 0,
    submittedAt: examInfo.submitted_at ? String(examInfo.submitted_at) : null,
    score,
    correct: correctCount,
    total: questions.length,
    questions,
    teacherComment: cmt?.comment || null,
  };
};

export const getStats = async (examId) => {
  const scoreRows = await query(
    `SELECT sa.student_id,
       ROUND(SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT q.id),0)*10, 1) AS score
     FROM student_answers sa
     JOIN answers a ON sa.answer_id=a.id
     JOIN questions q ON a.question_id=q.id
     WHERE sa.exam_id=:eid GROUP BY sa.student_id`,
    { eid: examId }
  );
  const scores = scoreRows.map(r => parseFloat(r.score || 0));

  const totalRow = await queryOne(
    `SELECT COUNT(DISTINCT u.id) AS total FROM users u
     JOIN class_exams ce ON ce.class_id=u.class_id
     WHERE ce.exam_id=:eid AND u.role='student'`,
    { eid: examId }
  );

  const qRows = await query(
    `SELECT q.id AS questionId, q.content,
       COUNT(DISTINCT sa.student_id) AS totalAnswered,
       SUM(CASE WHEN a.is_correct=1 AND sa.student_id IS NOT NULL THEN 1 ELSE 0 END) AS correctCount
     FROM questions q
     LEFT JOIN answers a ON a.question_id=q.id
     LEFT JOIN student_answers sa ON sa.answer_id=a.id AND sa.exam_id=:eid
     WHERE q.exam_id=:eid GROUP BY q.id ORDER BY q.id`,
    { eid: examId }
  );

  return {
    scores,
    total_students: totalRow?.total || 0,
    question_rows: qRows,
  };
};

export const getExportData = (examId) =>
  query(
    `SELECT u.full_name, u.username,
       ROUND(SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END)*10.0/NULLIF(COUNT(DISTINCT q.id),0),1) AS score,
       SUM(CASE WHEN a.is_correct=1 THEN 1 ELSE 0 END) AS correct_count,
       COUNT(DISTINCT q.id) AS total_questions,
       MAX(sa.time_spent) AS time_spent, MAX(sa.submitted_at) AS submitted_at
     FROM student_answers sa
     JOIN users u ON u.id=sa.student_id
     JOIN answers a ON sa.answer_id=a.id
     JOIN questions q ON a.question_id=q.id
     WHERE sa.exam_id=:eid GROUP BY sa.student_id ORDER BY score DESC`,
    { eid: examId }
  );

export const hasSubmitted = async (studentId, examId) => {
  const row = await queryOne(
    'SELECT id FROM student_answers WHERE student_id = :sid AND exam_id = :eid LIMIT 1',
    { sid: studentId, eid: examId }
  );
  return row != null;
};

export const submitExam = async (studentId, examId, answersData, timeSpent) => {
  return transaction(async (conn) => {
    const correctIds = await conn.query(
      `SELECT a.id FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE q.exam_id = :eid AND a.is_correct = 1`,
      { eid: examId }
    );
    const correctSet = new Set(correctIds.map(r => r.id));

    const totalRow = await conn.query(
      'SELECT COUNT(*) AS cnt FROM questions WHERE exam_id = :eid',
      { eid: examId }
    );
    const total = totalRow[0]?.cnt || 0;

    let scoreCount = 0;
    for (const item of answersData) {
      if (correctSet.has(Number(item.answerId))) scoreCount++;
      await conn.query(
        'INSERT INTO student_answers (student_id, exam_id, answer_id, time_spent) VALUES (:sid, :eid, :aid, :ts)',
        { sid: studentId, eid: examId, aid: item.answerId, ts: timeSpent }
      );
    }
    return {
      score: total ? parseFloat((scoreCount / total * 10).toFixed(1)) : 0,
      correct: scoreCount,
      total,
    };
  });
};

export const upsertComment = async (examId, studentId, teacherId, comment) => {
  const existing = await queryOne(
    'SELECT id FROM student_exam_comments WHERE exam_id = :eid AND student_id = :sid',
    { eid: examId, sid: studentId }
  );
  if (existing) {
    await query(
      'UPDATE student_exam_comments SET comment = :comment, teacher_id = :tid WHERE exam_id = :eid AND student_id = :sid',
      { comment, tid: teacherId, eid: examId, sid: studentId }
    );
  } else {
    await insert(
      'INSERT INTO student_exam_comments (exam_id, student_id, teacher_id, comment) VALUES (:eid, :sid, :tid, :comment)',
      { eid: examId, sid: studentId, tid: teacherId, comment }
    );
  }
};
