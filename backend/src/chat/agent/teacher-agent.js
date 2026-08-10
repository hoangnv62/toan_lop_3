import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { streamChatWithTools } from '../../utils/llm.utils.js';
import { executeTool } from '../tools/executor.js';
import { TEACHER_TOOLS, TOOL_LABELS } from '../tools/registry.js';
import { describeNow } from '../../utils/date.utils.js';

const __dir = dirname(fileURLToPath(import.meta.url));

// 3 là quá ít: yêu cầu rất thường gặp "giao cho lớp 3A một bài kiểm tra 5 câu về
// phép cộng" cần tới 4 vòng — get_classes → get_lessons → create_exam →
// assign_exam_to_class. Với trần 3, đề được tạo nhưng KHÔNG được giao, rồi vòng
// lặp thoát ra lúc model vẫn đang đòi gọi tool nên không có chữ nào để trả lời:
// giáo viên thấy chatbot im lặng dù việc đã làm một nửa.
const MAX_LOOPS = 8;

let _cachedPrompt = null;
const loadPrompt = async () => {
  if (!_cachedPrompt) {
    _cachedPrompt = await readFile(join(__dir, '../../prompts/teacher-system.md'), 'utf-8');
  }
  return _cachedPrompt;
};

// Ngày hiện tại phải nối thêm mỗi lượt, KHÔNG cache cùng nội dung file: backend
// có thể chạy liên tục nhiều ngày, cache lại thì hôm sau nó vẫn tưởng là hôm qua.
const buildSystemPrompt = async () => {
  const base = await loadPrompt();
  const now = describeNow();
  return `${base}

# Thời điểm hiện tại
Bây giờ là **${now.text}**. Hôm nay ở dạng ISO 8601 là \`${now.isoDate}\`.

Mọi mốc thời gian tương đối trong yêu cầu của giáo viên ("hôm nay", "ngày mai",
"tuần sau", "3 ngày nữa", "cuối tuần") phải tính ra ngày thật từ mốc trên rồi mới
đưa vào tool. TUYỆT ĐỐI không tự bịa ngày — deadline nằm ở quá khứ thì học sinh
không bao giờ làm được bài.`;
};

export const runTeacherAgent = async (messages, user, { onToken, onToolStart, onToolDone, signal }) => {
  const systemPrompt = await buildSystemPrompt();
  const history = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  console.log(`[agent] teacher start userId=${user.id} history=${history.length}`);

  // Gọi thẳng dạng stream có kèm tool. Model tự trả lời được thì token chạy ra
  // ngay trong lượt gọi này; nó chọn tool thì không phát token nào (Gemini trả
  // content rỗng khi gọi tool) và ta đi vào vòng lặp dưới. Cách này tốn 1 lượt
  // gọi cho câu thường, thay vì 2 như khi dò trước rồi stream lại.
  let assistantMsg = await streamChatWithTools(
    history, TEACHER_TOOLS, signal, 'teacher:answer', onToken
  );

  if (!assistantMsg.tool_calls?.length) return;

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

    // Câu chốt sau khi có dữ liệu tool cũng chạy chữ dần ngay ở đây, không đợi
    // xong mới đổ ra một cục như trước.
    assistantMsg = await streamChatWithTools(
      history, TEACHER_TOOLS, signal, `teacher:loop${loops}`, onToken
    );
    history.push(assistantMsg);
  }

  if (loops >= MAX_LOOPS && assistantMsg.tool_calls?.length) {
    console.warn(`[agent] teacher hit MAX_LOOPS=${MAX_LOOPS}, còn tool chưa chạy`);
    // Bỏ lượt cuối ra khỏi history: mỗi tool_call bắt buộc phải có kết quả đi
    // kèm ngay sau nó, để lại lượt đòi-gọi-tool mà không chạy thì lượt gọi chốt
    // bên dưới bị nhà cung cấp từ chối.
    history.pop();
  }

  // Không có chữ nào để trả lời (hết vòng lặp giữa chuỗi tool, hoặc model trả về
  // content rỗng) → gọi thêm một lượt KHÔNG kèm tool để buộc nó nói ra.
  //
  // Đây là lượt chat im lặng mà giáo viên gặp: việc đã làm xong một phần nhưng
  // không có câu trả lời nào. Tệ hơn nữa là chat.service chỉ lưu message trợ lý
  // khi có nội dung, nên lượt im lặng không được lưu — lượt sau model mất sạch
  // ngữ cảnh việc nó vừa làm và dễ làm lại từ đầu.
  if (!assistantMsg.content) {
    console.warn('[agent] teacher chưa có câu trả lời, gọi lại không kèm tool');
    assistantMsg = await streamChatWithTools(history, null, signal, 'teacher:final', onToken);
  }

  // Vẫn rỗng thì nói một câu tối thiểu — tuyệt đối không để chatbot im lặng.
  if (!assistantMsg.content) {
    console.error('[agent] teacher vẫn rỗng sau lượt chốt, dùng câu mặc định');
    onToken(
      'Em đã thao tác xong phần làm được nhưng chưa kịp tóm tắt lại. ' +
      'Thầy/cô kiểm tra giúp em ở màn hình bài học/lớp học, hoặc nhắc em "kể lại vừa làm gì" nhé.'
    );
  }

  console.log(`[agent] teacher done loops=${loops} content_len=${assistantMsg.content?.length || 0}`);
};
