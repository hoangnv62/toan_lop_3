import * as svc from '../services/relative.service.js';
import { success, created, successMsg } from '../utils/response.js';

export const getRelatives = async (req, res) => {
  success(res, await svc.getRelatives(parseInt(req.params.studentId)));
};

export const addRelative = async (req, res) => {
  const { name, phone, email = null, relationship = null } = req.body;
  const id = await svc.addRelative(
    parseInt(req.params.studentId),
    name.trim(), phone.trim(), email?.trim() || null, relationship
  );
  created(res, { id });
};

export const updateRelative = async (req, res) => {
  const { name, phone, email = null, relationship = null } = req.body;
  await svc.updateRelative(
    parseInt(req.params.id), req.user.id,
    name.trim(), phone.trim(), email?.trim() || null, relationship
  );
  successMsg(res, 'Đã cập nhật');
};

export const deleteRelative = async (req, res) => {
  await svc.deleteRelative(parseInt(req.params.id), req.user.id);
  successMsg(res, 'Đã xóa');
};
