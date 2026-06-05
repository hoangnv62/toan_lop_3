import XLSX from 'xlsx';
import * as svc from '../services/class.service.js';

export const getTeacherClasses = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  res.json({ success: true, data: await svc.getTeacherClasses(req.user.user_id, page, limit) });
};

export const getClassDetail = async (req, res) => {
  const studentPage = parseInt(req.query.studentPage) || 1;
  const studentLimit = parseInt(req.query.studentLimit) || 15;
  res.json({ success: true, data: await svc.getClassDetail(parseInt(req.params.id), studentPage, studentLimit) });
};

export const addClass = async (req, res) => {
  const { className } = req.body;
  await svc.addClass(req.user.user_id, className.trim());
  res.json({ success: true, message: `Tạo lớp "${className.trim()}" thành công` });
};

export const updateClass = async (req, res) => {
  const { className } = req.body;
  await svc.updateClass(parseInt(req.params.id), req.user.user_id, className.trim());
  res.json({ success: true, message: 'Cập nhật thành công' });
};

export const deleteClass = async (req, res) => {
  await svc.deleteClass(parseInt(req.params.id), req.user.user_id);
  res.json({ success: true, message: 'Đã xóa lớp' });
};

export const getClassExams = async (req, res) => {
  res.json({ success: true, data: await svc.getClassExams(parseInt(req.params.id), req.user.user_id) });
};

export const assignExam = async (req, res) => {
  const { examId, timeLimit, deadline, openTime } = req.body;
  await svc.assignExam(parseInt(req.params.id), req.user.user_id, examId, deadline, openTime, timeLimit);
  res.json({ success: true, message: 'Đã giao bài cho lớp' });
};

export const updateExamAssignment = async (req, res) => {
  const { timeLimit, deadline, openTime } = req.body;
  await svc.updateAssignment(parseInt(req.params.id), req.user.user_id, parseInt(req.params.examId), deadline, openTime, timeLimit);
  res.json({ success: true, message: 'Đã cập nhật hạn nộp' });
};

export const unassignExam = async (req, res) => {
  await svc.unassignExam(parseInt(req.params.id), req.user.user_id, parseInt(req.params.examId));
  res.json({ success: true, message: 'Đã thu hồi bài tập' });
};

export const getStudentsWithScores = async (req, res) => {
  res.json({ success: true, data: await svc.getStudentsWithScores(parseInt(req.params.id)) });
};

export const getAnnouncements = async (req, res) => {
  res.json({ success: true, data: await svc.getAnnouncements(parseInt(req.params.id)) });
};

export const createAnnouncement = async (req, res) => {
  const { title, content } = req.body;
  const id = await svc.createAnnouncement(parseInt(req.params.id), req.user.user_id, title.trim(), content.trim());
  res.status(201).json({ success: true, id });
};

export const deleteAnnouncement = async (req, res) => {
  await svc.deleteAnnouncement(parseInt(req.params.annId), req.user.user_id);
  res.json({ success: true, message: 'Đã xóa thông báo' });
};

export const exportStudents = async (req, res) => {
  const { className, students } = await svc.getStudentsForExport(parseInt(req.params.id), req.user.user_id);
  const wsData = [['STT', 'Họ và tên', 'Username', 'Ngày sinh', 'Điểm TB', 'Số bài đã làm']];
  students.forEach((s, i) => {
    wsData.push([i + 1, s.full_name, s.username,
      s.dob ? String(s.dob).split('T')[0] : '',
      parseFloat(s.avg_score || 0), parseInt(s.total_exams || 0)]);
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(className)}.xlsx"`);
  res.send(buffer);
};
