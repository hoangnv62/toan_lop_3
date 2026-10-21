import { randomUUID } from 'crypto';

// Tin nhắn trả lời của chatbot theo giao thức "UI Message Stream" của Vercel AI SDK
// (https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) — chuẩn mở dành riêng cho việc backend
// stream xuống giao diện chat, có chỗ cho dữ liệu riêng của app qua các part `data-*`.
//
// Writer làm 2 việc cùng lúc: phát từng chunk xuống client (emit) và gom `parts` (dạng
// UIMessage.parts) để lưu vào chat_messages.parts — F5 xong giao diện dựng lại y như lúc stream.
//
// Chunk phát ra: start → text-start / text-delta / text-end → tool-input-available →
// tool-output-available → data-<tên> → error → finish. Controller ghi mỗi chunk thành
// `data: <json>\n\n` và kết thúc bằng `data: [DONE]`.

export const UI_MESSAGE_STREAM_HEADER = ['x-vercel-ai-ui-message-stream', 'v1'];

export const textParts = (text) => [{ type: 'text', text }];

export const textOfParts = (parts) =>
  parts.filter(p => p.type === 'text').map(p => p.text).join('');

// Kết quả tool có thể rất dài (danh sách câu hỏi, thống kê) — chỉ lưu phần tóm tắt.
const summarizeToolOutput = (output) => ({ success: output?.success, message: output?.message });

export const createUiMessageWriter = (emit = () => {}) => {
  const messageId = `msg_${randomUUID()}`;
  const parts = [];
  let openText = null; // { id, part } — đoạn chữ đang stream

  const closeText = () => {
    if (!openText) return;
    emit({ type: 'text-end', id: openText.id });
    openText = null;
  };

  return {
    messageId,
    parts: () => parts,
    text: () => textOfParts(parts),

    start: () => emit({ type: 'start', messageId }),

    textDelta(delta) {
      if (!delta) return;
      if (!openText) {
        openText = { id: `text_${parts.length}`, part: { type: 'text', text: '' } };
        parts.push(openText.part);
        emit({ type: 'text-start', id: openText.id });
      }
      openText.part.text += delta;
      emit({ type: 'text-delta', id: openText.id, delta });
    },

    toolInput({ toolCallId, toolName, input }) {
      closeText();
      parts.push({ type: `tool-${toolName}`, toolCallId, state: 'input-available', input });
      emit({ type: 'tool-input-available', toolCallId, toolName, input });
    },

    toolOutput({ toolCallId, output }) {
      const summary = summarizeToolOutput(output);
      const part = parts.find(p => p.toolCallId === toolCallId);
      if (part) Object.assign(part, { state: 'output-available', output: summary });
      emit({ type: 'tool-output-available', toolCallId, output: summary });
    },

    // `stored`: bản rút gọn để lưu DB khi dữ liệu stream quá lớn (vd. toàn bộ đề thi).
    data(name, data, stored = data) {
      closeText();
      parts.push({ type: `data-${name}`, data: stored });
      emit({ type: `data-${name}`, data });
    },

    error(errorText) {
      closeText();
      emit({ type: 'error', errorText });
    },

    finish() {
      closeText();
      emit({ type: 'finish' });
    },
  };
};
