import api from './index';

export const getChatHistory = () => api.get('/api/chat/history');

/** Xóa phiên chat hiện tại để lượt hỏi kế tiếp bắt đầu với ngữ cảnh trắng. */
export const clearChatHistory = () => api.delete('/api/chat/history');

/** Bấm nút Đồng ý / Không cho hành động chatbot đang chờ xác nhận → `{ messages: [UIMessage, UIMessage] }`. */
export const confirmChatAction = (actionId, accept) =>
  api.post(`/api/chat/confirm/${actionId}`, { accept });

/** Thông điệp `action` A2UI khi giáo viên bấm nút trên form chatbot gửi → `{ surfaceId, summary, messages }`. */
export const sendA2uiAction = (action) => api.post('/api/chat/a2ui-action', action);

/**
 * Gửi câu hỏi và nhận câu trả lời theo giao thức "UI Message Stream" (Vercel AI SDK) qua XHR.
 * Mỗi chunk (`{type: 'text-delta' | 'tool-input-available' | 'data-…' | …}`) được đưa cho
 * onChunk; dựng tin nhắn từ chunk bằng applyChunk() ở `@/lib/ui-message-stream`.
 * @param {object} message - UIMessage của câu vừa hỏi: { id, role: 'user', parts }
 * @param {object} handlers
 * @param {(chunk: object) => void} handlers.onChunk
 * @param {() => void} [handlers.onDone]
 * @param {AbortSignal} [handlers.signal] - hủy giữa chừng khi người dùng bấm Dừng
 */
export async function streamChat(message, { onChunk, onDone, signal }) {
  let processed = 0;
  let pending = ''; // dòng chưa trọn — một chunk JSON có thể bị cắt giữa 2 lần nhận dữ liệu
  let done = false;

  await api.post(
    '/api/chat',
    { messages: [message] },
    {
      responseType: 'text',
      signal,
      onDownloadProgress: (evt) => {
        const raw = evt.event.target.responseText;
        pending += raw.slice(processed);
        processed = raw.length;

        const lines = pending.split('\n');
        pending = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            done = true;
            onDone?.();
            return;
          }
          try {
            onChunk(JSON.parse(payload));
          } catch { /* bỏ qua chunk hỏng */ }
        }
      },
    }
  );

  if (!done) onDone?.();
}
