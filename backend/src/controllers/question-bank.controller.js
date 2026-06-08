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
  const { content, explanation = null, answers = [], lessonId = null} = req.body;
  const id = await svc.createQuestion(req.user.id, content.trim(), explanation || null, answers, lessonId || null);
  created(res, { id });
};

export const updateQuestion = async (req, res) => {
  const { content, explanation = null, answers = [], lessonId = null } = req.body;
  await svc.updateQuestion(parseInt(req.params.id), req.user.id, content.trim(), explanation || null, answers, lessonId || null);
  successMsg(res, 'Đã cập nhật câu hỏi');
};

export const deleteQuestion = async (req, res) => {
  await svc.deleteQuestion(parseInt(req.params.id), req.user.id);
  successMsg(res, 'Đã xóa câu hỏi');
};

export const downloadSample = async (req, res) => {
  const buffer = svc.generateSampleExcel();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="mau_ngan_hang_cau_hoi.xlsx"');
  res.send(buffer);
};

export const importQuestions = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không tìm thấy file' });
  const lessonRaw = req.body?.lessonId;
  const lessonId = lessonRaw ? parseInt(lessonRaw) : null;
  const result = await svc.importQuestionsFromExcel(req.user.id, req.file.buffer, lessonId);
  success(res, result);
};
