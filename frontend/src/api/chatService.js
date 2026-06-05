import { API_BASE } from '../config';
import { getToken } from './index';

export async function streamChat(messages, onToken, onDone) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) throw new Error('Chat thất bại');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // giữ lại dòng chưa hoàn chỉnh

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') { onDone?.(); return; }
      try {
        const { token } = JSON.parse(payload);
        if (token) onToken(token);
      } catch { /* bỏ qua chunk lỗi */ }
    }
  }
  onDone?.();
}
