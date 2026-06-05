import XLSX from 'xlsx';
import * as userRepo from '../repositories/user.repository.js';
import * as classRepo from '../repositories/class.repository.js';
import * as studentRepo from '../repositories/student.repository.js';
import { NotFoundError, ConflictError } from '../utils/error.utils.js';
import { formatDate, formatDateTime } from '../utils/date.utils.js';

export const searchStudents = async (q, classId = null) => {
  const students = await userRepo.searchStudents(q);
  return students.map(s => ({
    ...s,
    already_in_class: classId != null && s.class_id === classId,
    dob: formatDate(s.dob),
  }));
};

export const addToClass = async (classId, teacherId, username) => {
  if (!await classRepo.findByIdAndTeacher(classId, teacherId)) throw new NotFoundError('Lớp không tồn tại');
  const student = await userRepo.findByUsernameAndRole(username, 'student');
  if (!student) throw new NotFoundError(`Không tìm thấy học sinh "${username}"`);
  if (student.class_id === classId) throw new ConflictError('Học sinh đã trong lớp này');
  if (student.class_id != null) throw new ConflictError('Học sinh đã thuộc lớp khác');
  await studentRepo.addToClass(student.id, classId);
  return student.full_name;
};

export const uploadStudents = async (classId, teacherId, fileBuffer) => {
  if (!await classRepo.findByIdAndTeacher(classId, teacherId)) throw new NotFoundError('Lớp không tồn tại');

  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const rows = rawRows.map(r => {
    const n = {};
    for (const [k, v] of Object.entries(r)) n[k.trim().toLowerCase()] = v;
    return n;
  });

  if (!rows.length || !('username' in rows[0])) throw new Error('File thiếu cột: username');

  let successCount = 0;
  const errors = [];
  for (const row of rows) {
    const username = String(row.username || '').trim();
    if (!username || username === 'nan') { errors.push('Bỏ qua dòng trống'); continue; }
    const student = await userRepo.findByUsernameAndRole(username, 'student');
    if (!student) { errors.push(`Không tìm thấy học sinh "${username}"`); continue; }
    if (student.class_id === classId) { errors.push(`"${username}" đã trong lớp này`); continue; }
    await studentRepo.addToClass(student.id, classId);
    successCount++;
  }

  if (successCount === 0) throw new NotFoundError('Không tìm thấy học sinh');
  return { count: successCount, errors };
};

export const generateSampleExcel = () => {
  const rows = [
    { username: 'hocsinh01' },
    { username: 'hocsinh02' },
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

export const removeFromClass = async (classId, teacherId, studentId) => {
  if (!await classRepo.findByIdAndTeacher(classId, teacherId)) throw new NotFoundError('Lớp không tồn tại');
  const student = await userRepo.findById(studentId);
  if (!student || student.class_id !== classId) throw new NotFoundError('Học sinh không trong lớp này');
  await studentRepo.removeFromClass(studentId);
};

export const getStudentResults = async (studentId) => {
  const student = await studentRepo.findById(studentId);
  if (!student) throw new NotFoundError('Học sinh không tồn tại');
  const results = await studentRepo.getResults(studentId);
  return {
    studentName: student.full_name,
    results: results.map(r => ({
      ...r,
      submittedAt: formatDateTime(r.submittedAt),
      score: r.score != null ? parseFloat(r.score) : null,
    })),
  };
};

export const getStudentProgress = async (studentId) => {
  const rows = await studentRepo.getProgress(studentId);
  return rows.map(r => ({
    ...r,
    submittedAt: formatDateTime(r.submittedAt),
    score: parseFloat(r.score || 0),
  }));
};

export const getStudentDashboard = async (studentId, showAll, dateFrom = null, dateTo = null) => {
  const teacherInfo = await studentRepo.getTeacherInfoForStudent(studentId);
  if (!teacherInfo) {
    return {
      exams: [], scores: [], ranking: [],
      progress: { totalExams: 0, done: 0, avg: 0 },
      announcements: [], teacher: null,
    };
  }
  const teacherId = teacherInfo.teacher_id;
  const df = showAll ? null : dateFrom;
  const dt = showAll ? null : dateTo;

  const lessonRows = await studentRepo.getLessonsWithStats(studentId, df, dt);
  const rankingRows = await studentRepo.getClassRanking(teacherId, df, dt);
  const announcements = await studentRepo.getAnnouncementsForStudent(studentId);
  const announcementsFormatted = announcements.map(a => ({
    ...a,
    created_at: formatDate(a.created_at),
  }));

  const exams = [];
  const scores = [];
  for (const r of lessonRows) {
    const done = Boolean(r.done);
    let score = null;
    if (done && r.total_questions) {
      score = parseFloat((parseFloat(r.correct_questions || 0) / parseFloat(r.total_questions) * 10).toFixed(1));
    }
    exams.push({
      examId: r.exam_id, examName: r.exam_name, lessonTitle: r.lesson_name,
      done, score,
      deadline: formatDateTime(r.deadline),
      openTime: formatDateTime(r.open_time),
    });
    if (done && score != null) {
      scores.push({ examName: r.exam_name, score, _created_at: r.exam_created_at });
    }
  }
  scores.sort((a, b) => String(a._created_at || '').localeCompare(String(b._created_at || '')));
  const scoresClean = scores.map(({ _created_at, ...s }) => s);

  const doneCount = exams.filter(e => e.done).length;
  const avg = scoresClean.length
    ? parseFloat((scoresClean.reduce((s, x) => s + x.score, 0) / scoresClean.length).toFixed(1))
    : null;

  const ranking = rankingRows.map(r => ({
    studentId: r.student_id,
    name: r.student_name,
    avg: r.total_questions
      ? parseFloat((parseFloat(r.correct_questions || 0) / parseFloat(r.total_questions) * 10).toFixed(1))
      : 0,
  }));

  return {
    exams, scores: scoresClean, ranking,
    progress: { totalExams: exams.length, done: doneCount, avg },
    announcements: announcementsFormatted,
    teacher: {
      fullName: teacherInfo.full_name,
      email: teacherInfo.email,
      phone: teacherInfo.phone,
    },
  };
};
