import { z } from 'zod';
import * as qbService from '../../../services/question-bank.service.js';

const answerSchema = z.object({
  content:   z.string().min(1),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  content:     z.string().min(1),
  explanation: z.string().optional(),
  answers:     z.array(answerSchema).length(4, 'Mỗi câu hỏi phải có đúng 4 đáp án'),
});

const schema = z.object({
  lesson_id: z.number().int().positive().optional(),
  questions: z.array(questionSchema).min(1, 'Phải có ít nhất 1 câu hỏi'),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { questions, lesson_id } = parsed.data;

  for (const q of questions) {
    const correctCount = q.answers.filter(a => a.isCorrect).length;
    if (correctCount !== 1) {
      return {
        success: false,
        data: null,
        message: `Câu hỏi "${q.content.slice(0, 40)}..." phải có đúng 1 đáp án đúng.`,
        metadata: {},
      };
    }
  }

  const count = await qbService.saveBatch(user.user_id, questions, lesson_id);

  return {
    success: true,
    data: { saved: count },
    message: `Đã lưu ${count} câu hỏi vào ngân hàng thành công.`,
    metadata: { tool: 'save_questions_to_bank', userId: user.user_id },
  };
};
