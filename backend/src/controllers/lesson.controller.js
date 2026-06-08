import * as svc from '../services/lesson.service.js';
import { success, created, successMsg } from '../utils/response.js';

export const getLessons = async (req, res) => {
  const q = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  success(res, await svc.getLessons(req.user.id, q, page, limit));
};

export const getLesson = async (req, res) => {
  success(res, await svc.getLesson(parseInt(req.params.id)));
};

export const createLesson = async (req, res) => {
  const { title } = req.body;
  await svc.createLesson(req.user.id, title.trim());
  created(res, null, 'Tạo bài học thành công');
};

export const updateLesson = async (req, res) => {
  const { title } = req.body;
  await svc.updateLesson(parseInt(req.params.id), req.user.id, title.trim());
  successMsg(res, 'Cập nhật thành công');
};

export const deleteLesson = async (req, res) => {
  await svc.deleteLesson(parseInt(req.params.id), req.user.id);
  successMsg(res, 'Đã xóa bài học');
};
