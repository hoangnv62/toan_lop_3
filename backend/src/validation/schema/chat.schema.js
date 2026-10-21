import { z } from 'zod';

export const confirmActionParamsSchema = z.object({
  actionId: z.string().uuid('Mã xác nhận không hợp lệ'),
});

export const confirmActionBodySchema = z.object({
  accept: z.boolean(),
});

// Body theo chuẩn UIMessage của AI SDK: { messages: [{ id?, role, parts: [{ type:'text', text }] }] }.
// Backend chỉ dùng tin cuối (câu vừa hỏi); ngữ cảnh lấy từ DB.
export const chatSchema = z.object({
  messages: z.array(z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant']),
    parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()).min(1),
  })).min(1).refine(
    (messages) => messages.at(-1).parts.some(p => p.type === 'text' && p.text?.trim()),
    'Tin nhắn trống',
  ),
});
