import * as svc from '../services/dashboard.service.js';
import { success } from '../utils/response.js';

export const teacherDashboard = async (req, res) => {
  success(res, await svc.getTeacherDashboard(req.user.id));
};

export const getAiAdvice = async (req, res) => {
  const { avg = 0, totalStudents = 0, distribution = {} } = req.body || {};
  success(res, await svc.getAiAdvice(avg, totalStudents, distribution));
};
