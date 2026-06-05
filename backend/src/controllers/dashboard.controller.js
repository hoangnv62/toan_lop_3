import * as svc from '../services/dashboard.service.js';

export const teacherDashboard = async (req, res) => {
  res.json({ success: true, data: await svc.getTeacherDashboard(req.user.user_id) });
};

export const getAiAdvice = async (req, res) => {
  const { avg = 0, totalStudents = 0, distribution = {} } = req.body || {};
  res.json({ success: true, data: await svc.getAiAdvice(avg, totalStudents, distribution) });
};
