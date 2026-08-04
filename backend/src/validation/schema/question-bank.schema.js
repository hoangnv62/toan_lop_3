import { z } from 'zod';

const answerSchema = z.object({
  content: z.string().min(1, 'Nội dung đáp án không được trống'),
  isCorrect: z.boolean(),
});

export const MAX_AI_QUESTIONS = 50;

export const questionBankGenerateSchema = z.object({
  lessonId: z.coerce.number({ error: 'Vui lòng chọn chủ đề' }).int().positive('Vui lòng chọn chủ đề'),
  numQuestions: z.coerce
    .number()
    .int()
    .min(1, 'Số câu hỏi phải từ 1 trở lên')
    .max(MAX_AI_QUESTIONS, `Tối đa ${MAX_AI_QUESTIONS} câu hỏi mỗi lần tạo`),
  description: z.string().max(500).optional().default(''),
});

// Lưu hàng loạt sau khi giáo viên xem lại kết quả AI. Cùng trần với lúc tạo.
export const questionBankBatchSchema = z.object({
  lessonId: z.coerce.number({ error: 'Vui lòng chọn chủ đề' }).int().positive('Vui lòng chọn chủ đề'),
  questions: z
    .array(
      z.object({
        content: z.string().min(1, 'Nội dung câu hỏi không được trống'),
        explanation: z.string().optional().default(''),
        answers: z
          .array(z.object({ content: z.string().min(1), isCorrect: z.boolean() }))
          .min(2, 'Mỗi câu hỏi cần ít nhất 2 đáp án'),
      })
    )
    .min(1, 'Không có câu hỏi nào để lưu')
    .max(MAX_AI_QUESTIONS, `Tối đa ${MAX_AI_QUESTIONS} câu hỏi mỗi lần lưu`),
});

// Giới hạn 500 để một request lỡ tay không quét sạch cả ngân hàng câu hỏi.
export const questionBankBulkDeleteSchema = z.object({
  ids: z
    .array(z.coerce.number().int().positive())
    .min(1, 'Vui lòng chọn ít nhất 1 câu hỏi')
    .max(500, 'Chỉ xóa được tối đa 500 câu hỏi mỗi lần'),
});

export const questionBankSchema = z.object({
  content: z.string().min(1, 'Nội dung câu hỏi không được trống'),
  explanation: z.string().nullable().optional(),
  lessonId: z.coerce
    .number({ error: 'Vui lòng chọn chủ đề cho câu hỏi' })
    .int()
    .positive('Vui lòng chọn chủ đề cho câu hỏi'),
  answers: z.array(answerSchema).default([]),
});
