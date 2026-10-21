import * as svc from '../services/relative.service.js';
import { success, created, successMsg } from '../utils/response.js';

// Body đã được relativeSchema trim và chuẩn hoá (trường bỏ trống → null).
export const getRelatives = async (req, res) => {
  success(res, await svc.getRelatives(parseInt(req.params.studentId), req.user));
};

export const addRelative = async (req, res) => {
  const relative = await svc.addRelative(parseInt(req.params.studentId), req.user.id, req.body);
  created(res, relative);
};

export const updateRelative = async (req, res) => {
  const relative = await svc.updateRelative(parseInt(req.params.id), req.user.id, req.body);
  success(res, relative, 'Đã cập nhật');
};

export const deleteRelative = async (req, res) => {
  await svc.deleteRelative(parseInt(req.params.id), req.user.id);
  successMsg(res, 'Đã xóa');
};
