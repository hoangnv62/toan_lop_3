import * as svc from '../services/question.service.js';
import { success } from '../utils/response.js';

export const generateQuestions = async (req, res) => {
  const { numQuestions, lessonTitle, examDescription } = req.body;
  const questions = await svc.generateQuestions(numQuestions, lessonTitle, examDescription);
  success(res, questions);
};

export const importQuestions = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không tìm thấy file' });
  const { questions, errors } = svc.importFromExcel(req.file.buffer);
  success(res, { questions, errors });
};
