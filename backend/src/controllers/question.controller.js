import * as svc from '../services/question.service.js';

export const generateQuestions = async (req, res) => {
  const { numQuestions, lessonTitle, examDescription } = req.body;
  const questions = await svc.generateQuestions(numQuestions, lessonTitle, examDescription);
  res.json({ success: true, data: questions });
};

export const importQuestions = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không tìm thấy file' });
  const { questions, errors } = svc.importFromExcel(req.file.buffer);
  res.json({ success: true, data: { questions, errors } });
};
