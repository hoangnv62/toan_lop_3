// Dựng tin nhắn từ các chunk của giao thức "UI Message Stream" (Vercel AI SDK) mà backend
// stream về — cùng việc với readUIMessageStream của AI SDK nhưng không phải thêm thư viện.
// Tin nhắn có dạng UIMessage: { id, role, parts: [...] }, giống hệt dạng backend lưu trong DB
// và trả ở GET /api/chat/history, nên lúc stream và sau khi F5 hiển thị y như nhau.

export const textMessage = (role, text, id = `local_${Date.now()}_${Math.random()}`) =>
  ({ id, role, parts: [{ type: 'text', text }] });

export const textOf = (message) =>
  message.parts.filter(p => p.type === 'text').map(p => p.text).join('');

export const findPart = (message, type) => message.parts.find(p => p.type === type);

const updatePart = (message, match, update) =>
  ({ ...message, parts: message.parts.map(p => (match(p) ? update(p) : p)) });

// Trả về tin nhắn MỚI (không sửa tin cũ) sau khi áp một chunk.
export function applyChunk(message, chunk) {
  switch (chunk.type) {
    case 'start':
      return { ...message, id: chunk.messageId ?? message.id };
    case 'text-start':
      // streamId chỉ để khớp các text-delta về đúng đoạn chữ; không thuộc chuẩn UIMessage.
      return { ...message, parts: [...message.parts, { type: 'text', text: '', streamId: chunk.id }] };
    case 'text-delta':
      return updatePart(message, p => p.streamId === chunk.id, p => ({ ...p, text: p.text + chunk.delta }));
    case 'tool-input-available':
      return {
        ...message,
        parts: [...message.parts, {
          type: `tool-${chunk.toolName}`, toolCallId: chunk.toolCallId,
          state: 'input-available', input: chunk.input,
        }],
      };
    case 'tool-output-available':
      return updatePart(message, p => p.toolCallId === chunk.toolCallId,
        p => ({ ...p, state: 'output-available', output: chunk.output }));
    case 'error':
      // Backend gửi câu xin lỗi thân thiện trong errorText — hiện như một đoạn trả lời.
      return { ...message, parts: [...message.parts, { type: 'text', text: chunk.errorText, isError: true }] };
    default:
      if (chunk.type?.startsWith('data-')) {
        return { ...message, parts: [...message.parts, { type: chunk.type, data: chunk.data }] };
      }
      return message; // text-end, finish, start-step... không đổi nội dung
  }
}
