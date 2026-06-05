import * as svc from '../services/relative.service.js';

export const getRelatives = async (req, res) => {
  res.json({ success: true, data: await svc.getRelatives(parseInt(req.params.studentId)) });
};

export const addRelative = async (req, res) => {
  const { name, phone, relationship = null } = req.body;
  const id = await svc.addRelative(parseInt(req.params.studentId), name.trim(), phone.trim(), relationship);
  res.status(201).json({ success: true, id });
};

export const updateRelative = async (req, res) => {
  const { name, phone, relationship = null } = req.body;
  await svc.updateRelative(parseInt(req.params.id), req.user.user_id, name.trim(), phone.trim(), relationship);
  res.json({ success: true, message: 'Đã cập nhật' });
};

export const deleteRelative = async (req, res) => {
  await svc.deleteRelative(parseInt(req.params.id), req.user.user_id);
  res.json({ success: true, message: 'Đã xóa' });
};
