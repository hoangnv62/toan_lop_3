import * as svc from '../services/lesson.service.js';

export const getLessons = async (req, res) => {
  const q = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  res.json({ success: true, data: await svc.getLessons(req.user.user_id, q, page, limit) });
};

export const getLesson = async (req, res) => {
  res.json({ success: true, data: await svc.getLesson(parseInt(req.params.id)) });
};

export const createLesson = async (req, res) => {
  const { title } = req.body;
  await svc.createLesson(req.user.user_id, title.trim());
  res.status(201).json({ success: true, message: 'Tạo bài học thành công' });
};

export const updateLesson = async (req, res) => {
  const { title } = req.body;
  await svc.updateLesson(parseInt(req.params.id), req.user.user_id, title.trim());
  res.json({ success: true, message: 'Cập nhật thành công' });
};

export const deleteLesson = async (req, res) => {
  await svc.deleteLesson(parseInt(req.params.id), req.user.user_id);
  res.json({ success: true, message: 'Đã xóa bài học' });
};
