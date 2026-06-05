import * as examRepo from '../repositories/exam.repository.js';
import * as classRepo from '../repositories/class.repository.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/error.utils.js';
import { generateJSON } from '../utils/ai.js';
import { buildExamPdf } from './pdf.service.js';
import { formatDate, formatDateTime } from '../utils/date.utils.js';

export const getExam = async (examId, studentId = null) => {
  const exam = await examRepo.findWithQuestions(examId);
  if (!exam) throw new NotFoundError('Bài tập không tồn tại');
  let timeLimit = null;
  if (studentId) {
    const row = await classRepo.findClassExamForStudent(studentId, examId);
    timeLimit = row ? parseInt(row.time_limit) : 20 * 60;
  }
  return {
    name: exam.name,
    description: exam.description,
    dateCreated: formatDate(exam.date_created),
    timeLimit,
    questions: exam.questions.map(q => ({
      questionId: q.id,
      questionContent: q.content,
      explanation: q.explanation,
      answers: q.answers.map(a => ({
        answerId: a.id,
        content: a.content,
        isCorrected: a.is_correct,
      })),
    })),
  };
};

export const getAssignments = async (examId, teacherId) => {
  const rows = await classRepo.findClassExamsByExamAndTeacher(examId, teacherId);
  return rows.map(r => ({
    ...r,
    assigned: Boolean(r.assigned),
    deadline: formatDateTime(r.deadline),
    assigned_at: formatDateTime(r.assigned_at),
    open_time: formatDateTime(r.open_time),
    time_limit: r.time_limit != null ? parseInt(r.time_limit) : null,
  }));
};

export const createExam = async (lessonId, name, description, questions) => {
  return examRepo.createExam(lessonId, name, description, questions);
};

export const updateExam = async (examId, lessonId, name, description, questions) => {
  const exam = await examRepo.findById(examId);
  if (!exam || exam.lesson_id !== lessonId) throw new NotFoundError('Bài tập không tồn tại');
  await examRepo.updateExam(examId, name, description, questions);
};

export const deleteExam = async (examId) => {
  const exam = await examRepo.findById(examId);
  if (!exam) throw new NotFoundError('Bài tập không tồn tại');
  await examRepo.deleteExam(examId);
};

export const cloneExam = async (examId) => {
  const exam = await examRepo.findById(examId);
  if (!exam) throw new NotFoundError('Bài tập không tồn tại');
  return examRepo.cloneExam(examId);
};

export const submitExam = async (examId, studentId, answers, timeSpent) => {
  if (await examRepo.hasSubmitted(studentId, examId)) throw new ConflictError('Bạn đã nộp bài rồi!');
  return examRepo.submitExam(studentId, examId, answers, timeSpent);
};

export const getResult = async (examId, studentId) => {
  const data = await examRepo.getExamResult(examId, studentId);
  if (!data) throw new NotFoundError('Bài tập không tồn tại');
  return data;
};

export const getStats = async (examId) => {
  const exam = await examRepo.findById(examId);
  if (!exam) throw new NotFoundError('Bài tập không tồn tại');
  const raw = await examRepo.getStats(examId);
  const { scores, total_students, question_rows } = raw;

  const dist = { '0-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
  for (const s of scores) {
    if (s < 4)      dist['0-4']++;
    else if (s < 6) dist['4-6']++;
    else if (s < 8) dist['6-8']++;
    else            dist['8-10']++;
  }

  const questionStats = question_rows.map(qr => {
    const ta = parseInt(qr.totalAnswered || 0);
    const cc = parseInt(qr.correctCount || 0);
    return {
      questionId: qr.questionId,
      content: qr.content,
      totalAnswered: ta,
      correctCount: cc,
      correctRate: ta > 0 ? parseFloat((cc / ta * 100).toFixed(1)) : 0,
    };
  });

  return {
    examName: exam.name,
    totalStudents: total_students,
    completedStudents: scores.length,
    avgScore: scores.length ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0,
    distribution: dist,
    questions: questionStats,
  };
};

export const generateAiFeedback = async (examId, studentId) => {
  const data = await getResult(examId, studentId);
  const wrong = (data.questions || []).filter(q => !q.isCorrect);
  if (!wrong.length) return 'Xuất sắc! Em đã trả lời đúng tất cả các câu hỏi. Hãy tiếp tục phát huy nhé!';

  const lines = wrong.map(q => {
    const correct = (q.answers || []).find(a => a.isCorrected == 1)?.content || '';
    const chosen = (q.answers || []).find(a => a.isSelected && a.isCorrected != 1)?.content || 'không rõ';
    return `- "${q.questionContent}"\n  Đáp án đúng: ${correct} | Em chọn: ${chosen}`;
  });

  const prompt = `Bạn là giáo viên Toán lớp 3 đang nhận xét bài làm của học sinh.
Bài kiểm tra: ${data.examName || 'Toán lớp 3'}
Kết quả: ${data.score}/10 — đúng ${data.correct}/${data.total} câu.

Các câu trả lời sai:
${lines.join('\n')}

Viết 1 đoạn nhận xét (2-4 câu) bằng tiếng Việt, thân thiện dành cho học sinh lớp 3.
Trả về JSON: {"feedback": "..."}`;

  const result = await generateJSON(prompt);
  return result.feedback || '';
};

export const analyzeExamStats = async (examId) => {
  const stats = await getStats(examId);
  if (!stats.completedStudents) return [];

  const qs = stats.questions || [];
  let hard = qs.filter(q => q.totalAnswered > 0 && q.correctRate < 50);
  if (!hard.length) hard = [...qs].sort((a, b) => a.correctRate - b.correctRate).slice(0, 3);

  const hardSummary = hard.map((q, i) =>
    `- Câu ${i + 1}: "${q.content.slice(0, 80)}" — tỉ lệ đúng ${q.correctRate}% (${q.correctCount}/${q.totalAnswered} HS)`
  ).join('\n');

  const dist = stats.distribution || {};
  const prompt = `Bạn là chuyên gia giáo dục Toán lớp 3. Phân tích kết quả bài kiểm tra:
Tên bài: ${stats.examName}
Học sinh nộp bài: ${stats.completedStudents}/${stats.totalStudents}
Điểm trung bình: ${stats.avgScore}/10
Phân bố: 0-4: ${dist['0-4'] || 0} HS, 4-6: ${dist['4-6'] || 0} HS, 6-8: ${dist['6-8'] || 0} HS, 8-10: ${dist['8-10'] || 0} HS.

Câu hỏi học sinh làm sai nhiều nhất:
${hardSummary}

Đưa ra CHÍNH XÁC 3 nhận xét và lời khuyên thực tế cho giáo viên Toán lớp 3.
Trả về JSON: {"insights": [{"title": "...", "detail": "..."}, ...]}`;

  const result = await generateJSON(prompt);
  return result.insights || [];
};

export const saveComment = async (examId, studentId, teacherId, comment) => {
  await examRepo.upsertComment(examId, studentId, teacherId, comment);
};

export const exportPdf = async (examId, variantsCount, duration) => {
  const exam = await examRepo.findWithQuestions(examId);
  if (!exam) throw new NotFoundError('Bài tập không tồn tại');
  const questions = exam.questions.map(q => ({
    question_id: q.id,
    content: q.content,
    answers: q.answers.map(a => ({
      answer_id: a.id,
      content: a.content,
      is_correct: Boolean(a.is_correct),
    })),
  }));
  return buildExamPdf(exam.name, duration, questions, variantsCount);
};

export const exportResults = async (examId) => {
  const exam = await examRepo.findById(examId);
  if (!exam) throw new NotFoundError('Bài tập không tồn tại');
  const rows = await examRepo.getExportData(examId);
  return { examName: exam.name, rows };
};
