import api from './index';

export const getChatHistory = () => api.get('/api/chat/history');

/**
 * Gửi câu hỏi và nhận câu trả lời dạng stream (SSE qua XHR).
 * @param {Array} messages
 * @param {object} handlers
 * @param {(token: string) => void} handlers.onToken
 * @param {() => void} [handlers.onDone]
 * @param {(data: object) => void} [handlers.onToolStart]
 * @param {(data: object) => void} [handlers.onToolDone]
 * @param {AbortSignal} [handlers.signal] - hủy giữa chừng khi người dùng bấm Dừng
 */
export async function streamChat(messages, { onToken, onDone, onToolStart, onToolDone, signal }) {
  let processed = 0;
  let done = false;
  let currentEvent = null;

  await api.post(
    '/api/chat',
    { messages },
    {
      responseType: 'text',
      signal,
      onDownloadProgress: (evt) => {
        const raw = evt.event.target.responseText;
        const newText = raw.slice(processed);
        processed = raw.length;

        const lines = newText.split('\n');
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            continue;
          }
          if (line.startsWith('data: ')) {
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') {
              done = true;
              onDone?.();
              return;
            }
            try {
              const parsed = JSON.parse(payload);
              if (currentEvent === 'tool_start') {
                onToolStart?.(parsed);
              } else if (currentEvent === 'tool_done') {
                onToolDone?.(parsed);
              } else if (parsed.token) {
                onToken(parsed.token);
              }
            } catch { /* bỏ qua chunk lỗi */ }
            currentEvent = null;
            continue;
          }
          if (line === '') {
            currentEvent = null;
          }
        }
      },
    }
  );

  if (!done) onDone?.();
}
