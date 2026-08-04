import XLSX from 'xlsx';
import * as qbRepo from '../repositories/question-bank.repository.js';
import * as lessonRepo from '../repositories/lesson.repository.js';
import { importFromExcel as parseExcel, generateQuestions as generateWithAI } from './question.service.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/error.utils.js';

export const listQuestions = async (teacherId, q = '', page = 1, limit = 10, lessonId = undefined) => {
  return qbRepo.findByTeacher(teacherId, q, page, limit, lessonId);
};

export const createQuestion = async (teacherId, content, explanation, answers, lessonId = null) => {
  return qbRepo.createQuestion(teacherId, content, explanation, answers, lessonId);
};

export const updateQuestion = async (questionId, teacherId, content, explanation, answers, lessonId = null) => {
  const q = await qbRepo.findById(questionId);
  if (!q) throw new NotFoundError('Câu hỏi không tồn tại');
  if (q.teacher_id !== teacherId) throw new ForbiddenError();
  await qbRepo.updateQuestion(questionId, content, explanation, answers, lessonId);
};

export const deleteQuestion = async (questionId, teacherId) => {
  const q = await qbRepo.findById(questionId);
  if (!q) throw new NotFoundError('Câu hỏi không tồn tại');
  if (q.teacher_id !== teacherId) throw new ForbiddenError();
  await qbRepo.deleteQuestion(questionId);
};

export const deleteQuestions = async (ids, teacherId) => {
  // ids trùng nhau sẽ làm affectedRows lệch so với kỳ vọng của người dùng.
  const uniqueIds = [...new Set(ids)];
  const deleted = await qbRepo.deleteManyByTeacher(uniqueIds, teacherId);
  if (deleted === 0) throw new NotFoundError('Không tìm thấy câu hỏi nào để xóa');
  // Xóa được ít hơn số đã chọn = có id không tồn tại hoặc của giáo viên khác.
  // Không coi là lỗi, nhưng trả về cả 2 số để giao diện nói đúng sự thật.
  return { deleted, requested: uniqueIds.length };
};

export const generateSampleExcel = () => {
  const rows = [
    { 'câu hỏi': '3 + 4 = ?', 'đáp án a': '5', 'đáp án b': '6', 'đáp án c': '7', 'đáp án d': '8', 'đáp án đúng': 'c', 'giải thích': '3 cộng 4 bằng 7' },
    { 'câu hỏi': '10 - 6 = ?', 'đáp án a': '3', 'đáp án b': '4', 'đáp án c': '5', 'đáp án d': '6', 'đáp án đúng': 'b', 'giải thích': '10 trừ 6 bằng 4' },
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

// Kiểm tra bài học có thật và đúng chủ. Dùng chung cho tạo AI lẫn lưu hàng loạt.
const assertOwnsLesson = async (lessonId, teacherId) => {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson || lesson.teacher_id !== teacherId) throw new NotFoundError('Bài học không tồn tại');
  return lesson;
};

// Model thỉnh thoảng trả câu thiếu đáp án hoặc đánh dấu 2 đáp án đúng. Lọc bỏ
// thay vì lưu rác, và trả về số bị loại để giao diện nói thật với giáo viên.
const toBankQuestion = (q) => {
  const answers = (q.answers || [])
    .filter(a => a?.content?.trim())
    .map(a => ({ content: String(a.content).trim(), isCorrect: a.isCorrected === 1 || a.isCorrected === true }));
  if (answers.length !== 4) return null;
  if (answers.filter(a => a.isCorrect).length !== 1) return null;
  const content = String(q.questionContent || '').trim();
  if (!content) return null;
  return { content, explanation: String(q.explanation || '').trim(), answers };
};

// Đo thực tế: 5 câu mất ~16s, nên xin 50 câu trong một lệnh gọi sẽ vượt timeout
// 60s của SDK và treo. Chia thành nhiều lệnh gọi nhỏ chạy song song.
const AI_CHUNK_SIZE = 10;

const normalize = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export const generateQuestions = async (teacherId, lessonId, numQuestions, description) => {
  const lesson = await assertOwnsLesson(lessonId, teacherId);

  const chunks = [];
  for (let left = numQuestions; left > 0; left -= AI_CHUNK_SIZE) {
    chunks.push(Math.min(AI_CHUNK_SIZE, left));
  }

  // allSettled chứ không phải all: một chunk hỏng thì vẫn giữ được phần còn lại,
  // giáo viên có 40 câu vẫn hơn là mất trắng cả mẻ.
  const settled = await Promise.allSettled(
    chunks.map((size, i) => {
      // Các chunk không thấy nhau nên dễ ra trùng đề — nhắc model đổi dạng bài.
      const hint = chunks.length > 1
        ? `${description || ''} (nhóm ${i + 1}/${chunks.length} — hãy ra dạng bài và con số khác các nhóm khác)`
        : description || '';
      return generateWithAI(size, lesson.title, hint);
    })
  );

  const failed = settled.filter(r => r.status === 'rejected').length;
  const raw = settled.flatMap(r => (r.status === 'fulfilled' ? r.value : []));

  const seen = new Set();
  const questions = [];
  for (const q of raw) {
    const mapped = toBankQuestion(q);
    if (!mapped) continue;
    const key = normalize(mapped.content);
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(mapped);
  }

  if (questions.length === 0) throw new BadRequestError('AI không tạo được câu hỏi hợp lệ, vui lòng thử lại');

  console.log(
    `[qb-ai] lessonId=${lessonId} requested=${numQuestions} chunks=${chunks.length} failed=${failed} raw=${raw.length} kept=${questions.length}`
  );

  // Xin dư vì chunk có thể trả thừa; cắt về đúng số giáo viên yêu cầu.
  return {
    questions: questions.slice(0, numQuestions),
    requested: numQuestions,
    discarded: raw.length - questions.length,
  };
};

export const saveBatch = async (teacherId, questions, lessonId = null) => {
  if (!questions?.length) throw new BadRequestError('Không có câu hỏi nào để lưu');
  await assertOwnsLesson(lessonId, teacherId);
  const questionsData = questions.map(q => ({
    questionContent: q.content,
    explanation: q.explanation || null,
    answers: q.answers.map(a => ({ content: a.content, isCorrected: a.isCorrect })),
  }));
  return qbRepo.bulkCreate(teacherId, questionsData, lessonId ?? null);
};

export const importQuestionsFromExcel = async (teacherId, fileBuffer, lessonId = null) => {
  const { questions, errors } = parseExcel(fileBuffer);
  const count = await qbRepo.bulkCreate(teacherId, questions, lessonId);
  return { imported: count, errors };
};
