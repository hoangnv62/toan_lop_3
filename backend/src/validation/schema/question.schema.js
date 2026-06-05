import { z } from 'zod';

export const generateQuestionsSchema = z.object({
  numQuestions: z.coerce.number().int().positive().default(5),
  lessonTitle: z.string().default(''),
  examDescription: z.string().default(''),
});
