import { z } from 'zod';
import * as lessonService from '../../../services/lesson.service.js';
import { lessonTitleSchema, normalizeTitle, teacherLessons } from '../lesson-titles.js';

const schema = z.object({
  lesson_id: z.number().int().positive(),
  title: lessonTitleSchema,
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }
  const { lesson_id, title } = parsed.data;
  const lessons = await teacherLessons(user.id);

  const lesson = lessons.find(l => l.id === lesson_id);
  if (!lesson) {
    return {
      success: false, data: null, metadata: {},
      message: 'Bài học không tồn tại hoặc không thuộc quyền quản lý của thầy/cô.',
    };
  }
  const clash = lessons.find(
    l => l.id !== lesson_id && normalizeTitle(l.title) === normalizeTitle(title),
  );
  if (clash) {
    return {
      success: false, data: null, metadata: {},
      message: `Đã có bài học khác tên "${clash.title}" — đổi tên này sẽ thành 2 bài trùng tên.`,
    };
  }

  await lessonService.updateLesson(lesson_id, user.id, title);
  return {
    success: true,
    data: { lessonId: lesson_id, oldTitle: lesson.title, title },
    message: `Đã đổi tên bài học "${lesson.title}" thành "${title}".`,
    metadata: { tool: 'update_lesson', userId: user.id },
  };
};
