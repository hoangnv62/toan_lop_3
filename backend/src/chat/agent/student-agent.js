import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { streamChat } from '../../utils/llm.utils.js';

const __dir = dirname(fileURLToPath(import.meta.url));

let _cachedPrompt = null;
const loadPrompt = async () => {
  if (!_cachedPrompt) {
    _cachedPrompt = await readFile(join(__dir, '../../prompts/student-system.md'), 'utf-8');
  }
  return _cachedPrompt;
};

export const runStudentAgent = async (messages, { onToken, signal }) => {
  const systemPrompt = await loadPrompt();
  const history = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];
  const stream = await streamChat(history, signal);
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) onToken(token);
  }
};
