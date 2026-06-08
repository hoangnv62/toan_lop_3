import { z } from 'zod';
import * as examService from '../../../services/exam.service.js';

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
  lesson_id:   z.number().int().positive(),
  name:        z.string().min(1),
  description: z.string().optional(),
  questions:   z.array(questionSchema).min(1),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { lesson_id, name, description, questions } = parsed.data;

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

  const questionsData = questions.map(q => ({
    questionContent: q.content,
    explanation:     q.explanation || null,
    answers:         q.answers.map(a => ({ content: a.content, isCorrected: a.isCorrect })),
  }));

  const examId = await examService.createExamForTeacher(
    user.id, lesson_id, name, description || '', questionsData
  );

  return {
    success: true,
    data: { examId, name, questionsCount: questions.length },
    message: `Đã tạo đề thi "${name}" với ${questions.length} câu hỏi thành công.`,
    metadata: { tool: 'create_exam', userId: user.id },
  };
};
