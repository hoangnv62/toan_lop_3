import { z } from 'zod';

const answerSchema = z.object({
  content: z.string().min(1, 'Nội dung đáp án không được trống'),
  isCorrect: z.boolean(),
});

export const questionBankSchema = z.object({
  content: z.string().min(1, 'Nội dung câu hỏi không được trống'),
  explanation: z.string().nullable().optional(),
  lessonId: z.coerce.number().int().positive().nullable().optional(),
  answers: z.array(answerSchema).default([]),
});
