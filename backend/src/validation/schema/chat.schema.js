import { z } from 'zod';

export const confirmActionParamsSchema = z.object({
  actionId: z.string().uuid('Mã xác nhận không hợp lệ'),
});

// Thông điệp `action` của A2UI v0.9 (client → server).
export const a2uiActionSchema = z.object({
  name: z.string().min(1),
  surfaceId: z.string().min(1).max(100),
  sourceComponentId: z.string().optional(),
  timestamp: z.string().optional(),
  context: z.record(z.string(), z.unknown()).default({}),
  sessionId: z.number().int().positive().optional(),
});

export const confirmActionBodySchema = z.object({
  accept: z.boolean(),
  sessionId: z.number().int().positive().optional(),
});

export const sessionParamsSchema = z.object({
  sessionId: z.coerce.number().int().positive('Mã cuộc trò chuyện không hợp lệ'),
});

export const renameSessionBodySchema = z.object({
  title: z.string().trim().min(1, 'Tên cuộc trò chuyện không được trống').max(120),
});

// Body theo chuẩn UIMessage của AI SDK: { messages: [{ id?, role, parts: [{ type:'text', text }] }] }.
// Backend chỉ dùng tin cuối (câu vừa hỏi); ngữ cảnh lấy từ DB.
export const chatSchema = z.object({
  // Hội thoại đang mở; bỏ trống = mở hội thoại mới.
  sessionId: z.number().int().positive().optional(),
  messages: z.array(z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant']),
    parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()).min(1),
  })).min(1).refine(
    (messages) => messages.at(-1).parts.some(p => p.type === 'text' && p.text?.trim()),
    'Tin nhắn trống',
  ),
});
