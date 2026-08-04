import * as svc from '../services/question-bank.service.js';
import { success, created, successMsg } from '../utils/response.js';

export const listQuestions = async (req, res) => {
  const q = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const lessonRaw = req.query.lessonId;
  const lessonId = lessonRaw !== undefined ? parseInt(lessonRaw) : undefined;
  success(res, await svc.listQuestions(req.user.id, q, page, limit, lessonId));
};

export const createQuestion = async (req, res) => {
  const { content, explanation = null, answers = [], lessonId } = req.body;
  const id = await svc.createQuestion(req.user.id, content.trim(), explanation || null, answers, lessonId);
  created(res, { id });
};

export const updateQuestion = async (req, res) => {
  const { content, explanation = null, answers = [], lessonId } = req.body;
  await svc.updateQuestion(parseInt(req.params.id), req.user.id, content.trim(), explanation || null, answers, lessonId);
  successMsg(res, 'Đã cập nhật câu hỏi');
};

export const deleteQuestion = async (req, res) => {
  await svc.deleteQuestion(parseInt(req.params.id), req.user.id);
  successMsg(res, 'Đã xóa câu hỏi');
};

export const generateQuestions = async (req, res) => {
  const { lessonId, numQuestions, description } = req.body;
  const result = await svc.generateQuestions(req.user.id, lessonId, numQuestions, description);
  success(res, result);
};

export const saveQuestionsBatch = async (req, res) => {
  const { lessonId, questions } = req.body;
  const saved = await svc.saveBatch(req.user.id, questions, lessonId);
  created(res, { saved }, `Đã lưu ${saved} câu hỏi vào ngân hàng`);
};

export const deleteQuestions = async (req, res) => {
  const { deleted, requested } = await svc.deleteQuestions(req.body.ids, req.user.id);
  success(res, { deleted, requested }, `Đã xóa ${deleted} câu hỏi`);
};

export const downloadSample = async (req, res) => {
  const buffer = svc.generateSampleExcel();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="mau_ngan_hang_cau_hoi.xlsx"');
  res.send(buffer);
};

export const importQuestions = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không tìm thấy file' });
  // Import đi qua multipart nên không dùng được Zod như 2 route kia — chặn tay ở đây.
  const lessonId = parseInt(req.body?.lessonId);
  if (!Number.isInteger(lessonId) || lessonId <= 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn chủ đề trước khi import' });
  }
  const result = await svc.importQuestionsFromExcel(req.user.id, req.file.buffer, lessonId);
  success(res, result);
};
