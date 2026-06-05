import XLSX from 'xlsx';
import * as svc from '../services/exam.service.js';

export const getExam = async (req, res) => {
  const studentId = req.user.role === 'student' ? req.user.user_id : null;
  res.json({ success: true, data: await svc.getExam(parseInt(req.params.id), studentId) });
};

export const getExamAssignments = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  res.json({ success: true, data: await svc.getAssignments(parseInt(req.params.id), req.user.user_id) });
};

export const createExam = async (req, res) => {
  const { name, description, questions = [] } = req.body || {};
  const examId = await svc.createExam(parseInt(req.params.lessonId), name, description, questions);
  res.json({ success: true, message: 'Tạo bài kiểm tra thành công', examId });
};

export const updateExam = async (req, res) => {
  const { name, description, questions = [] } = req.body || {};
  await svc.updateExam(parseInt(req.params.examId), parseInt(req.params.lessonId), name, description, questions);
  res.json({ success: true, message: 'Cập nhật bài kiểm tra thành công' });
};

export const deleteExam = async (req, res) => {
  await svc.deleteExam(parseInt(req.params.id));
  res.json({ success: true, message: 'Đã xóa bài tập' });
};

export const cloneExam = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  const examId = await svc.cloneExam(parseInt(req.params.id));
  res.json({ success: true, message: 'Đã sao chép bài tập', examId });
};

export const submitExam = async (req, res) => {
  const { answers, timeSpent } = req.body;
  const result = await svc.submitExam(parseInt(req.params.id), req.user.user_id, answers, timeSpent);
  res.json({ success: true, data: result });
};

export const getExamResult = async (req, res) => {
  res.json({ success: true, data: await svc.getResult(parseInt(req.params.id), req.user.user_id) });
};

export const getStudentSubmission = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
  res.json({ success: true, data: await svc.getResult(parseInt(req.params.id), parseInt(req.params.studentId)) });
};

export const exportExamResults = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  const { examName, rows } = await svc.exportResults(parseInt(req.params.id));
  const wsData = [['STT', 'Họ tên', 'Username', 'Điểm', 'Số câu đúng', 'Tổng câu', 'Thời gian (giây)', 'Thời gian nộp']];
  rows.forEach((row, i) => {
    wsData.push([i + 1, row.full_name, row.username,
      parseFloat(row.score || 0), parseInt(row.correct_count || 0),
      parseInt(row.total_questions || 0), parseInt(row.time_spent || 0),
      row.submitted_at ? String(row.submitted_at) : '']);
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Kết quả thi');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(examName)}.xlsx"`);
  res.send(buffer);
};

export const exportExamPdf = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  const variants = Math.max(1, Math.min(20, parseInt(req.query.variants) || 1));
  const duration = Math.max(5, Math.min(180, parseInt(req.query.duration) || 45));
  const pdfBuffer = await svc.exportPdf(parseInt(req.params.id), variants, duration);
  const exam = req.params.id;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="exam-${exam}.pdf"`);
  res.send(pdfBuffer);
};

export const getExamStats = async (req, res) => {
  res.json({ success: true, data: await svc.getStats(parseInt(req.params.id)) });
};

export const aiExamFeedback = async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Không có quyền' });
  const feedback = await svc.generateAiFeedback(parseInt(req.params.id), req.user.user_id);
  res.json({ success: true, data: { feedback } });
};

export const aiStatsAnalysis = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  const insights = await svc.analyzeExamStats(parseInt(req.params.id));
  res.json({ success: true, data: { insights } });
};

export const saveComment = async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Không có quyền' });
  const { comment } = req.body;
  await svc.saveComment(parseInt(req.params.id), parseInt(req.params.studentId), req.user.user_id, comment.trim());
  res.json({ success: true, message: 'Đã lưu nhận xét' });
};
