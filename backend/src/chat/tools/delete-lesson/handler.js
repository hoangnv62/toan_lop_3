import { z } from 'zod';
import * as lessonRepo from '../../../repositories/lesson.repository.js';
import * as lessonService from '../../../services/lesson.service.js';
import { consumeConfirmation, requestConfirmation } from '../confirmation.js';

const schema = z.object({
  lesson_id: z.number().int().positive(),
});

const NOT_FOUND_MESSAGE = 'Bài học không tồn tại hoặc không thuộc quyền quản lý của thầy/cô.';

const findOwnedLesson = async (lessonId, teacherId) => {
  const lesson = await lessonRepo.findById(lessonId);
  return lesson && lesson.teacher_id === teacherId ? lesson : null;
};

const describeLoss = (c) => {
  const items = [
    [c.exams, 'đề thi'], [c.questions, 'câu hỏi trong đề'], [c.assignments, 'lượt giao đề'],
    [c.submissions, 'bài làm của học sinh'], [c.bank_questions, 'câu hỏi ngân hàng'],
  ].filter(([n]) => Number(n) > 0).map(([n, label]) => `${n} ${label}`);
  return items.length
    ? `mất luôn ${items.join(', ')}`
    : 'bài học đang trống, không mất dữ liệu nào khác';
};

// Kiểm tra lại quyền ngay lúc xóa: giữa lúc hỏi và lúc bấm nút, bài có thể đã bị xóa ở nơi khác.
const deleteOwnedLesson = async (lessonId, teacherId) => {
  const lesson = await findOwnedLesson(lessonId, teacherId);
  if (!lesson) return { success: false, data: null, message: NOT_FOUND_MESSAGE, metadata: {} };
  await lessonService.deleteLesson(lessonId, teacherId);
  return {
    success: true,
    data: { lessonId, title: lesson.title },
    message: `Đã xóa bài học "${lesson.title}" cùng toàn bộ đề thi và câu hỏi thuộc bài.`,
    metadata: { tool: 'delete_lesson', userId: teacherId },
  };
};

export const handler = async (args, user, { turnStartedAt = Date.now() } = {}) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }
  const { lesson_id } = parsed.data;

  const lesson = await findOwnedLesson(lesson_id, user.id);
  if (!lesson) return { success: false, data: null, message: NOT_FOUND_MESSAGE, metadata: {} };

  // Xóa dây chuyền mọi thứ thuộc bài (FK CASCADE), không khôi phục được — giống delete_exam,
  // lần gọi đầu chỉ hỏi; chỉ nút "Đồng ý" hoặc lượt chat sau mới xóa thật.
  const key = `delete_lesson:${user.id}:${lesson_id}`;
  if (!consumeConfirmation(key, turnStartedAt)) {
    const loss = describeLoss(await lessonRepo.countLessonContent(lesson_id));
    const confirmation = requestConfirmation({
      key,
      userId: user.id,
      label: `Xóa bài học "${lesson.title}"`,
      run: async () => (await deleteOwnedLesson(lesson_id, user.id)).message,
    }, turnStartedAt);
    return {
      success: false,
      data: { lessonId: lesson_id, title: lesson.title, requiresConfirmation: true, confirmation },
      message:
        `CHƯA XÓA. Hãy hỏi thầy/cô xác nhận xóa bài học "${lesson.title}" — ${loss}, không khôi ` +
        'phục được. Nêu rõ những gì sẽ mất. KHÔNG gọi lại trong lượt này.',
      metadata: { tool: 'delete_lesson', userId: user.id },
    };
  }

  return deleteOwnedLesson(lesson_id, user.id);
};
