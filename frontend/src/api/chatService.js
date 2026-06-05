import api from './index';

export async function streamChat(messages, role, onToken, onDone) {
  let processed = 0;
  let done = false;

  await api.post(
    '/api/chat',
    { messages, role },
    {
      responseType: 'text',
      onDownloadProgress: (evt) => {
        const raw = evt.event.target.responseText;
        const newText = raw.slice(processed);
        processed = raw.length;

        const lines = newText.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            done = true;
            onDone?.();
            return;
          }
          try {
            const { token } = JSON.parse(payload);
            if (token) onToken(token);
          } catch { /* bỏ qua chunk lỗi */ }
        }
      },
    }
  );

  if (!done) onDone?.();
}
