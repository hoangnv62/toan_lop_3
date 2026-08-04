import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { chatCompletion, streamChat } from '../../utils/llm.utils.js';
import { executeTool } from '../tools/executor.js';
import { TEACHER_TOOLS, TOOL_LABELS } from '../tools/registry.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const MAX_LOOPS = 3;

let _cachedPrompt = null;
const loadPrompt = async () => {
  if (!_cachedPrompt) {
    _cachedPrompt = await readFile(join(__dir, '../../prompts/teacher-system.md'), 'utf-8');
  }
  return _cachedPrompt;
};

export const runTeacherAgent = async (messages, user, { onToken, onToolStart, onToolDone, signal }) => {
  const systemPrompt = await loadPrompt();
  const history = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  console.log(`[agent] teacher start userId=${user.id} history=${history.length}`);

  // First call: detect whether tools are needed
  let assistantMsg = await chatCompletion(history, TEACHER_TOOLS, signal, 'teacher:detect');

  // No tools → re-call as streaming for better UX
  if (!assistantMsg.tool_calls?.length) {
    const stream = await streamChat(history, signal, 'teacher:answer');
    for await (const chunk of stream) {
      const token = chunk?.choices[0]?.delta?.content;
      if (token) onToken(token);
    }
    return;
  }

  // Agentic loop: execute tools, feed results back, repeat
  history.push(assistantMsg);

  let loops = 0;
  while (assistantMsg.tool_calls?.length > 0 && loops < MAX_LOOPS) {
    loops++;
    console.log(`[agent] teacher loop=${loops}/${MAX_LOOPS} tools=${assistantMsg.tool_calls.length}`);

    for (const tc of assistantMsg.tool_calls) {
      // Tool chạy trên DB nên không nhận signal — chặn ở đây để lần hủy có hiệu
      // lực ngay giữa chuỗi tool thay vì phải đợi hết vòng lặp.
      if (signal?.aborted) return;

      const name = tc.function.name;
      onToolStart({ tool: name, label: TOOL_LABELS[name] || name });

      let args = {};
      try { args = JSON.parse(tc.function.arguments); } catch {}

      const result = await executeTool(name, args, user);
      onToolDone({ tool: name });

      history.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }

    assistantMsg = await chatCompletion(history, TEACHER_TOOLS, signal, `teacher:loop${loops}`);
    history.push(assistantMsg);
  }

  if (loops >= MAX_LOOPS && assistantMsg.tool_calls?.length) {
    console.warn(`[agent] teacher hit MAX_LOOPS=${MAX_LOOPS}, còn tool chưa chạy`);
  }

  // Stream final response after tools
  if (assistantMsg.content) {
    onToken(assistantMsg.content);
  }
  console.log(`[agent] teacher done loops=${loops} content_len=${assistantMsg.content?.length || 0}`);
};
