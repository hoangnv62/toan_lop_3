import * as svc from '../services/question-bank.service.js';

export const listQuestions = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  const q = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const lessonRaw = req.query.lessonId;
  const lessonId = lessonRaw !== undefined ? parseInt(lessonRaw) : undefined;
  res.json({ success: true, data: await svc.listQuestions(req.user.user_id, q, page, limit, lessonId) });
};

export const createQuestion = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  const { content, explanation = null, answers = [], lessonId = null } = req.body;
  const id = await svc.createQuestion(req.user.user_id, content.trim(), explanation || null, answers, lessonId || null);
  res.status(201).json({ success: true, id });
};

export const updateQuestion = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  const { content, explanation = null, answers = [], lessonId = null } = req.body;
  await svc.updateQuestion(parseInt(req.params.id), req.user.user_id, content.trim(), explanation || null, answers, lessonId || null);
  res.json({ success: true, message: 'Đã cập nhật câu hỏi' });
};

export const deleteQuestion = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  await svc.deleteQuestion(parseInt(req.params.id), req.user.user_id);
  res.json({ success: true, message: 'Đã xóa câu hỏi' });
};

export const downloadSample = async (req, res) => {
  const buffer = svc.generateSampleExcel();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="mau_ngan_hang_cau_hoi.xlsx"');
  res.send(buffer);
};

export const importQuestions = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  if (!req.file) return res.status(400).json({ success: false, message: 'Không tìm thấy file' });
  const lessonRaw = req.body?.lessonId;
  const lessonId = lessonRaw ? parseInt(lessonRaw) : null;
  const result = await svc.importQuestionsFromExcel(req.user.user_id, req.file.buffer, lessonId);
  res.json({ success: true, data: result });
};
