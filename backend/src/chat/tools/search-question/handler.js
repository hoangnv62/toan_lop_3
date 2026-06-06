import { z } from 'zod';
import * as qbService from '../../../services/question-bank.service.js';

const schema = z.object({
  topic:     z.string().optional(),
  lesson_id: z.number().int().positive().optional(),
  limit:     z.number().int().min(1).max(20).default(10),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { topic, lesson_id, limit } = parsed.data;
  const result = await qbService.listQuestions(user.user_id, topic || '', 1, limit, lesson_id);

  return {
    success: true,
    data: result,
    message: `Tìm thấy ${result.total} câu hỏi${topic ? ` về "${topic}"` : ''}.`,
    metadata: { tool: 'search_question_bank', userId: user.user_id },
  };
};
