import api from './index';

export async function streamChat(messages, onToken, onDone, onToolStart, onToolDone) {
  let processed = 0;
  let done = false;
  let currentEvent = null;

  await api.post(
    '/api/chat',
    { messages },
    {
      responseType: 'text',
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
