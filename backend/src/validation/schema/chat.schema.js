import { z } from 'zod';

export const confirmActionParamsSchema = z.object({
  actionId: z.string().uuid('Mã xác nhận không hợp lệ'),
});

export const confirmActionBodySchema = z.object({
  accept: z.boolean(),
});

export const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1),
  })).min(1),
});
