import { z } from 'zod';
import * as lessonService from '../../../services/lesson.service.js';

const schema = z.object({
  query: z.string().optional(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { query = '' } = parsed.data;
  const result = await lessonService.getLessons(user.user_id, query, 1, 50);

  const lessons = result.items.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description || '',
    examCount: Number(r.exam_count || 0),
  }));

  return {
    success: true,
    data: { lessons, total: result.total },
    message: lessons.length
      ? `Tìm thấy ${lessons.length} bài học${query ? ` khớp "${query}"` : ''}.`
      : 'Không có bài học nào.',
    metadata: { tool: 'get_lessons', userId: user.user_id },
  };
};
