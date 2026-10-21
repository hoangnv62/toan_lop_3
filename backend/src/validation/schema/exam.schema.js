import { z } from 'zod';

export const submitExamSchema = z.object({
  // Có thể rỗng: hết giờ thì frontend tự nộp kể cả khi chưa chọn câu nào. Thời gian làm bài do
  // server tính từ lượt làm bài — không nhận timeSpent từ client nữa.
  answers: z.array(z.object({
    questionId: z.number().int().positive(),
    answerId: z.number().int().positive(),
  })),
});

export const saveAttemptAnswerSchema = z.object({
  questionId: z.number().int().positive(),
  answerId: z.number().int().positive(),
});

export const saveCommentSchema = z.object({
  comment: z.string().min(1, 'Nhận xét không được trống'),
});
