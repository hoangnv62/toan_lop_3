import XLSX from 'xlsx';
import * as qbRepo from '../repositories/question-bank.repository.js';
import { importFromExcel as parseExcel } from './question.service.js';
import { NotFoundError, ForbiddenError } from '../utils/error.utils.js';

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

export const importQuestionsFromExcel = async (teacherId, fileBuffer, lessonId = null) => {
  const { questions, errors } = parseExcel(fileBuffer);
  const count = await qbRepo.bulkCreate(teacherId, questions, lessonId);
  return { imported: count, errors };
};
