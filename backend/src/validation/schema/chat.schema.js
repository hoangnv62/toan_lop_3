import { z } from 'zod';

export const chatSchema = z.object({
  role: z.enum(['teacher', 'student']).optional().default('student'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1),
  })).min(1),
});
