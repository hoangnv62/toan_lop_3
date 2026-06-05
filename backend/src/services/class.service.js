import * as classRepo from '../repositories/class.repository.js';
import * as examRepo from '../repositories/exam.repository.js';
import { NotFoundError, ConflictError } from '../utils/error.utils.js';
import { formatDate, formatDateTime } from '../utils/date.utils.js';

export const getTeacherClasses = async (teacherId, page = 1, limit = 12) => {
  const result = await classRepo.findByTeacherWithStats(teacherId, page, limit);
  const items = result.items.map(r => {
    const total = r.totalAnswers || 0;
    const correct = r.correctAnswers || 0;
    const avgScore = total ? parseFloat((correct / total * 10).toFixed(2)) : null;
    const passRate = total ? parseFloat((correct / total * 100).toFixed(2)) : 0;
    const status = passRate >= 70 ? 'good' : passRate >= 50 ? 'warning' : 'bad';
    return {
      classId: r.classId, className: r.className,
      totalStudents: r.totalStudents, avgScore, passRate, status,
    };
  });
  return { items, total: result.total, page: result.page, pages: result.pages };
};

export const getClassDetail = async (classId, studentPage = 1, studentLimit = 15) => {
  const cls = await classRepo.findById(classId);
  if (!cls) throw new NotFoundError('Lớp không tồn tại');
  const paged = await classRepo.getStudentsWithAvg(classId, studentPage, studentLimit);
  const classAvg = await classRepo.getClassAvg(classId);
  return {
    classId: cls.id, className: cls.class_name,
    totalStudents: paged.total,
    students: paged.items.map(s => ({
      id: s.id,
      username: s.username,
      fullName: s.full_name,
      dob: formatDate(s.dob),
      avgScore: s.avg_score != null ? Number(s.avg_score) : null,
    })),
    studentPage: paged.page,
    studentPages: paged.pages,
    classAvg,
  };
};

export const addClass = async (teacherId, className) => {
  await classRepo.createClass(teacherId, className);
};

export const updateClass = async (classId, teacherId, className) => {
  const cls = await classRepo.findByIdAndTeacher(classId, teacherId);
  if (!cls) throw new NotFoundError('Lớp không tồn tại');
  await classRepo.updateClass(classId, className);
};

export const deleteClass = async (classId, teacherId) => {
  const cls = await classRepo.findByIdAndTeacher(classId, teacherId);
  if (!cls) throw new NotFoundError('Lớp không tồn tại');
  await classRepo.deleteClass(classId);
};

export const getClassExams = async (classId, teacherId) => {
  const cls = await classRepo.findByIdAndTeacher(classId, teacherId);
  if (!cls) throw new NotFoundError('Lớp không tồn tại');
  const rows = await classRepo.findClassExamsByClass(classId);
  return rows.map(r => ({
    ...r,
    deadline: formatDateTime(r.deadline),
    assigned_at: formatDateTime(r.assigned_at),
    open_time: formatDateTime(r.open_time),
    time_limit: r.time_limit != null ? parseInt(r.time_limit) : null,
  }));
};

export const assignExam = async (classId, teacherId, examId, deadline, openTime, timeLimit) => {
  if (!await classRepo.findByIdAndTeacher(classId, teacherId)) throw new NotFoundError('Lớp không tồn tại');
  const exam = await examRepo.findById(examId);
  if (!exam) throw new NotFoundError('Bài tập không tồn tại');
  try {
    await classRepo.assignExam(classId, examId, deadline, openTime, timeLimit);
  } catch (e) {
    if (String(e).includes('Duplicate') || String(e).includes('uq_class_exam')) {
      throw new ConflictError('Bài tập đã được giao cho lớp này');
    }
    throw e;
  }
};

export const updateAssignment = async (classId, teacherId, examId, deadline, openTime, timeLimit) => {
  if (!await classRepo.findByIdAndTeacher(classId, teacherId)) throw new NotFoundError('Lớp không tồn tại');
  const ce = await classRepo.findClassExamByClassAndExam(classId, examId);
  if (!ce) throw new NotFoundError('Bài tập chưa được giao cho lớp này');
  await classRepo.updateExamAssignment(classId, examId, deadline, openTime, timeLimit);
};

export const unassignExam = async (classId, teacherId, examId) => {
  if (!await classRepo.findByIdAndTeacher(classId, teacherId)) throw new NotFoundError('Lớp không tồn tại');
  const ce = await classRepo.findClassExamByClassAndExam(classId, examId);
  if (!ce) throw new NotFoundError('Bài tập chưa được giao cho lớp này');
  await classRepo.unassignExam(classId, examId);
};

export const getStudentsWithScores = async (classId) => {
  const cls = await classRepo.findById(classId);
  if (!cls) throw new NotFoundError('Lớp không tồn tại');
  return classRepo.getStudentsWithScores(classId);
};

export const getStudentsForExport = async (classId, teacherId) => {
  const cls = await classRepo.findByIdAndTeacher(classId, teacherId);
  if (!cls) throw new NotFoundError('Lớp không tồn tại');
  return { className: cls.class_name, students: await classRepo.getStudentsForExport(classId) };
};

export const getAnnouncements = async (classId) => {
  const rows = await classRepo.findAnnouncementsByClass(classId);
  return rows.map(a => ({
    id: a.id, title: a.title, content: a.content,
    created_at: formatDate(a.created_at),
  }));
};

export const createAnnouncement = async (classId, teacherId, title, content) => {
  if (!await classRepo.findByIdAndTeacher(classId, teacherId)) throw new NotFoundError('Lớp không tồn tại');
  return classRepo.createAnnouncement(classId, teacherId, title, content);
};

export const deleteAnnouncement = async (annId, teacherId) => {
  const ann = await classRepo.findAnnouncementByIdAndTeacher(annId, teacherId);
  if (!ann) throw new NotFoundError('Thông báo không tồn tại');
  await classRepo.deleteAnnouncement(annId);
};
