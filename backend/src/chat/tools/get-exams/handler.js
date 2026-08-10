import { z } from 'zod';
import * as examService from '../../../services/exam.service.js';

const schema = z.object({
  lesson_id: z.coerce.number().int().positive().optional(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { lesson_id: lessonId } = parsed.data;
  // Quyền sở hữu do service kiểm: lọc theo lessons.teacher_id, và chặn hẳn khi
  // lesson_id được truyền mà bài học không thuộc giáo viên này.
  const exams = await examService.getExamsForTeacher(user.id, lessonId ?? null);

  return {
    success: true,
    data: { exams, total: exams.length },
    message: exams.length
      ? `Có ${exams.length} đề thi.`
      : 'Chưa có đề thi nào.',
    metadata: { tool: 'get_exams', userId: user.id },
  };
};
