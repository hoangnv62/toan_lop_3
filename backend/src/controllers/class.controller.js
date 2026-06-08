import XLSX from 'xlsx';
import * as svc from '../services/class.service.js';
import { formatDate } from '../utils/date.utils.js';
import { success, created, successMsg } from '../utils/response.js';

export const getTeacherClasses = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  success(res, await svc.getTeacherClasses(req.user.id, page, limit));
};

export const getClassDetail = async (req, res) => {
  const studentPage = parseInt(req.query.studentPage) || 1;
  const studentLimit = parseInt(req.query.studentLimit) || 15;
  success(res, await svc.getClassDetail(parseInt(req.params.id), studentPage, studentLimit));
};

export const addClass = async (req, res) => {
  const { className } = req.body;
  await svc.addClass(req.user.id, className.trim());
  successMsg(res, `Tạo lớp "${className.trim()}" thành công`);
};

export const updateClass = async (req, res) => {
  const { className } = req.body;
  await svc.updateClass(parseInt(req.params.id), req.user.id, className.trim());
  successMsg(res, 'Cập nhật thành công');
};

export const deleteClass = async (req, res) => {
  await svc.deleteClass(parseInt(req.params.id), req.user.id);
  successMsg(res, 'Đã xóa lớp');
};

export const getClassExams = async (req, res) => {
  success(res, await svc.getClassExams(parseInt(req.params.id), req.user.id));
};

export const assignExam = async (req, res) => {
  const { examId, timeLimit, deadline, openTime } = req.body;
  await svc.assignExam(parseInt(req.params.id), req.user.id, examId, deadline, openTime, timeLimit);
  successMsg(res, 'Đã giao bài cho lớp');
};

export const updateExamAssignment = async (req, res) => {
  const { timeLimit, deadline, openTime } = req.body;
  await svc.updateAssignment(parseInt(req.params.id), req.user.id, parseInt(req.params.examId), deadline, openTime, timeLimit);
  successMsg(res, 'Đã cập nhật hạn nộp');
};

export const unassignExam = async (req, res) => {
  await svc.unassignExam(parseInt(req.params.id), req.user.id, parseInt(req.params.examId));
  successMsg(res, 'Đã thu hồi bài tập');
};

export const getStudentsWithScores = async (req, res) => {
  success(res, await svc.getStudentsWithScores(parseInt(req.params.id)));
};

export const getAnnouncements = async (req, res) => {
  success(res, await svc.getAnnouncements(parseInt(req.params.id)));
};

export const createAnnouncement = async (req, res) => {
  const { title, content } = req.body;
  const id = await svc.createAnnouncement(parseInt(req.params.id), req.user.id, title.trim(), content.trim());
  created(res, { id });
};

export const deleteAnnouncement = async (req, res) => {
  await svc.deleteAnnouncement(parseInt(req.params.annId), req.user.id);
  successMsg(res, 'Đã xóa thông báo');
};

export const exportStudents = async (req, res) => {
  const { className, students } = await svc.getStudentsForExport(parseInt(req.params.id), req.user.id);
  const wsData = [['STT', 'Họ và tên', 'Username', 'Ngày sinh', 'Điểm TB', 'Số bài đã làm']];
  students.forEach((s, i) => {
    wsData.push([i + 1, s.full_name, s.username,
      formatDate(s.dob) ?? '',
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
