import * as attemptRepo from '../repositories/exam-attempt.repository.js';
import * as classRepo from '../repositories/class.repository.js';
import * as examRepo from '../repositories/exam.repository.js';
import { getStudentExamView, validateSubmittedAnswers } from './exam.service.js';
import { ConflictError, ForbiddenError } from '../utils/error.utils.js';

// Học sinh làm bài theo LƯỢT do server ghi (exam_attempts): giờ hết hạn = started_at + time_limit,
// không reset khi thoát ra vào lại. Đáp án tự lưu lên server; hết giờ mà chưa nộp thì chấm theo
// đáp án đã lưu. Trước đây đồng hồ chỉ chạy trong trình duyệt — F5 là được làm lại từ đầu giờ.

// Bù cho mạng chậm: nộp trễ trong khoảng này vẫn nhận đáp án gửi kèm.
export const GRACE_SECONDS = 60;
const SUBMITTED_MESSAGE = 'Bạn đã nộp bài rồi!';
const EXPIRED_MESSAGE = 'Đã hết giờ làm bài — bài đã được nộp tự động theo các đáp án đã chọn';

const endsAtOf = (attempt) =>
  new Date(new Date(attempt.started_at).getTime() + attempt.time_limit * 1000);
const isExpired = (attempt) => Date.now() > endsAtOf(attempt).getTime() + GRACE_SECONDS * 1000;

const findStudentAssignment = async (examId, studentId) => {
  const assignment = await classRepo.findClassExamForStudent(studentId, examId);
  if (!assignment) throw new ForbiddenError('Bài tập không được giao cho lớp của bạn');
  if (assignment.open_time && new Date(assignment.open_time) > new Date()) {
    throw new ForbiddenError('Chưa đến giờ mở đề');
  }
  return assignment;
};

// Chấm các lượt đã quá giờ mà chưa nộp (đóng tab, mất mạng...). Gọi định kỳ từ index.js và trước
// khi đọc kết quả của học sinh. Trả số lượt đã chốt.
export const finalizeExpiredAttempts = async (filter = {}) => {
  const expired = await attemptRepo.findExpiredOpenAttempts(GRACE_SECONDS, filter);
  for (const { id } of expired) await attemptRepo.finalizeAttempt(id);
  return expired.length;
};

// Lượt đang làm của học sinh; đã nộp → 409; quá giờ → chốt luôn rồi 409 (frontend chuyển sang
// trang kết quả).
const findOpenAttempt = async (examId, studentId) => {
  const attempt = await attemptRepo.findAttempt(studentId, examId);
  if (!attempt) {
    if (await examRepo.hasSubmitted(studentId, examId)) throw new ConflictError(SUBMITTED_MESSAGE);
    return null;
  }
  if (attempt.submitted_at) throw new ConflictError(SUBMITTED_MESSAGE);
  if (isExpired(attempt)) {
    await attemptRepo.finalizeAttempt(attempt.id);
    throw new ConflictError(EXPIRED_MESSAGE);
  }
  return attempt;
};

// Mở đề: lần đầu tạo lượt (chỉ khi chưa quá hạn nộp); các lần sau làm tiếp đúng lượt đó — kể cả
// khi hạn nộp đã qua, vì học sinh đã bắt đầu trước hạn.
export const startOrResumeExam = async (examId, studentId) => {
  const assignment = await findStudentAssignment(examId, studentId);
  let attempt = await findOpenAttempt(examId, studentId);
  if (!attempt) {
    if (assignment.deadline && new Date(assignment.deadline) < new Date()) {
      throw new ForbiddenError('Bài tập đã hết hạn nộp');
    }
    attempt = await attemptRepo.createAttempt(studentId, examId, parseInt(assignment.time_limit));
  }

  const [exam, saved] = await Promise.all([
    getStudentExamView(examId),
    attemptRepo.findSavedAnswers(attempt.id),
  ]);
  return {
    ...exam,
    timeLimit: attempt.time_limit,
    attempt: {
      startedAt: new Date(attempt.started_at).toISOString(),
      endsAt: endsAtOf(attempt).toISOString(),
      // Trình duyệt đếm ngược theo đồng hồ server — chỉnh giờ máy cũng không được thêm giờ.
      serverNow: new Date().toISOString(),
      savedAnswers: Object.fromEntries(saved.map(r => [r.question_id, r.answer_id])),
    },
  };
};

// Tự lưu một đáp án (chọn lại câu đã chọn thì ghi đè).
export const saveAttemptAnswer = async (examId, studentId, { questionId, answerId }) => {
  await findStudentAssignment(examId, studentId);
  const attempt = await findOpenAttempt(examId, studentId);
  if (!attempt) throw new ForbiddenError('Bạn chưa mở đề này');
  await validateSubmittedAnswers(examId, [{ questionId, answerId }]);
  await attemptRepo.saveAnswer(attempt.id, questionId, answerId);
};

// Nộp bài. Còn giờ (kể cả trễ trong GRACE_SECONDS): lưu đáp án gửi kèm rồi chấm. Quá giờ: bỏ qua
// đáp án gửi kèm, chấm theo đáp án đã tự lưu — không nhận thêm đáp án sau giờ.
export const submitAttempt = async (examId, studentId, answers) => {
  // Giáo viên gỡ giao đề / dời giờ mở khi học sinh đang làm thì không nhận bài nữa.
  await findStudentAssignment(examId, studentId);
  const attempt = await attemptRepo.findAttempt(studentId, examId);
  if (!attempt) {
    if (await examRepo.hasSubmitted(studentId, examId)) throw new ConflictError(SUBMITTED_MESSAGE);
    throw new ForbiddenError('Bạn chưa mở đề này');
  }
  if (attempt.submitted_at) throw new ConflictError(SUBMITTED_MESSAGE);

  const late = isExpired(attempt);
  if (!late) {
    await validateSubmittedAnswers(examId, answers);
    for (const { questionId, answerId } of answers) {
      await attemptRepo.saveAnswer(attempt.id, questionId, answerId);
    }
  }
  const result = await attemptRepo.finalizeAttempt(attempt.id);
  if (!result) throw new ConflictError(SUBMITTED_MESSAGE);
  return { ...result, autoSubmitted: late };
};
