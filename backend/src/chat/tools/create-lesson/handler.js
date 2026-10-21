import { z } from 'zod';
import * as lessonService from '../../../services/lesson.service.js';
import {
  findSimilarLessons, lessonTitleSchema, normalizeTitle, teacherLessons,
} from '../lesson-titles.js';

const schema = z.object({
  title: lessonTitleSchema,
  allow_similar: z.boolean().optional(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }
  const { title } = parsed.data;
  const lessons = await teacherLessons(user.id);

  // Đã có đúng bài này → dùng luôn, không tạo trùng.
  const existing = lessons.find(l => normalizeTitle(l.title) === normalizeTitle(title));
  if (existing) {
    return {
      success: true,
      data: { lessonId: existing.id, title: existing.title, created: false },
      message: `Đã có sẵn bài học "${existing.title}" nên không tạo thêm — dùng bài này.`,
      metadata: { tool: 'create_lesson', userId: user.id },
    };
  }

  const similar = findSimilarLessons(lessons, title);
  if (similar.length && !parsed.data.allow_similar) {
    return {
      success: false,
      data: { similar: similar.map(l => ({ lessonId: l.id, title: l.title })) },
      message:
        `CHƯA TẠO — đã có bài gần trùng tên: ${similar.map(l => `"${l.title}"`).join(', ')}. ` +
        'Hỏi thầy/cô dùng bài sẵn có hay vẫn tạo bài mới (khi đó gọi lại với allow_similar=true).',
      metadata: { tool: 'create_lesson', userId: user.id },
    };
  }

  const lessonId = await lessonService.createLesson(user.id, title);
  return {
    success: true,
    data: { lessonId, title, created: true },
    message: `Đã tạo bài học "${title}".`,
    metadata: { tool: 'create_lesson', userId: user.id },
  };
};
