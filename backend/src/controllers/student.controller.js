import * as svc from '../services/student.service.js';
import { success, successMsg } from '../utils/response.js';

export const downloadSampleStudents = async (req, res) => {
  const buffer = svc.generateSampleExcel();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="mau_import_hocsinh.xlsx"');
  res.send(buffer);
};

export const searchStudents = async (req, res) => {
  const q = (req.query.q || '').trim();
  const classId = req.query.classId ? parseInt(req.query.classId) : null;
  if (!q) return success(res, []);
  success(res, await svc.searchStudents(q, classId));
};

export const addToClass = async (req, res) => {
  const { username } = req.body;
  const fullName = await svc.addToClass(parseInt(req.params.classId), req.user.id, username.trim());
  successMsg(res, `Đã thêm ${fullName} vào lớp`);
};

export const uploadStudents = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không tìm thấy file' });
  const result = await svc.uploadStudents(parseInt(req.params.classId), req.user.id, req.file.buffer);
  let msg = `Thêm thành công ${result.count} học sinh.`;
  if (result.errors.length) msg += ` Có ${result.errors.length} lỗi: ` + result.errors.slice(0, 3).join('; ');
  successMsg(res, msg);
};

export const removeFromClass = async (req, res) => {
  await svc.removeFromClass(parseInt(req.params.classId), req.user.id, parseInt(req.params.studentId));
  successMsg(res, 'Đã gỡ học sinh khỏi lớp');
};

export const getStudentResults = async (req, res) => {
  success(res, await svc.getStudentResults(parseInt(req.params.id)));
};

export const getStudentProgress = async (req, res) => {
  success(res, await svc.getStudentProgress(parseInt(req.params.id)));
};

export const studentDashboard = async (req, res) => {
  const showAll = req.query.all === 'true';
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
  if (!showAll && dateFrom && dateTo && dateFrom > dateTo)
    return res.status(400).json({ success: false, message: 'dateFrom phải nhỏ hơn hoặc bằng dateTo' });
  success(res, await svc.getStudentDashboard(req.user.id, showAll, dateFrom, dateTo));
};
