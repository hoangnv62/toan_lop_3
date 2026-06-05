import { z } from 'zod';

export const submitExamSchema = z.object({
  answers: z.array(z.coerce.number().int()).min(1, 'Thiếu dữ liệu câu trả lời'),
  timeSpent: z.coerce.number().int().min(0).default(0),
});

export const saveCommentSchema = z.object({
  comment: z.string().min(1, 'Nhận xét không được trống'),
});
