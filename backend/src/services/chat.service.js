import { runTeacherAgent } from '../chat/agent/teacher-agent.js';
import { runStudentAgent } from '../chat/agent/student-agent.js';
import { Authority } from '../constants/authority.js';
import * as chatRepo from '../repositories/chat.repository.js';
import { takePendingAction } from '../chat/tools/confirmation.js';
import { NotFoundError } from '../utils/error.utils.js';
import { textParts } from '../chat/ui-message.js';

// Số tin nhắn gần nhất được đưa vào ngữ cảnh. Đủ để nhớ mạch hội thoại nhưng
// không kéo theo cả ngày làm việc trước đó.
const HISTORY_WINDOW = 10;

// Bỏ những tin nhắn CŨ của người dùng mà trợ lý chưa từng trả lời.
//
// Vì sao cần: một lượt chat lỗi (hết vòng lặp tool, model trả rỗng, mạng đứt)
// để lại tin của giáo viên mà không có tin trả lời nào. Lượt sau, model nhìn
// thấy chỉ thị đang treo đó và TỰ THI HÀNH nó — đã bắt được ca chỉ chào "hôm nay
// lớp 3A thế nào" mà nó tạo hẳn một đề thi rồi giao cho lớp.
//
// Tin cuối luôn được giữ: đó chính là câu vừa gửi của lượt này.
const dropUnansweredRequests = (messages) =>
  messages.filter((m, i) => {
    if (m.role !== 'user') return true;
    if (i === messages.length - 1) return true;
    return messages[i + 1]?.role === 'assistant';
  });

// Dữ liệu đề đầy đủ chỉ cần lúc stream (nút bấm là hiện ngay); trong DB chỉ giữ examId, F5 xong
// bấm nút thì frontend tự gọi GET /api/exams/:id.
const storedExamPreview = ({ examId, name, questions }) =>
  ({ examId, name, questionCount: questions?.length ?? 0 });

// writer: createUiMessageWriter() do controller tạo — phát chunk xuống client và gom parts.
export const runChat = async (newUserContent, role, user, { signal, writer }) => {
  const { id: sessionId } = await chatRepo.getOrCreateSession(user.id);
  const userMessageId = await chatRepo.saveMessage(sessionId, 'user', newUserContent);

  const dbMessages = await chatRepo.getSessionMessages(sessionId, HISTORY_WINDOW);
  const history = dropUnansweredRequests(dbMessages)
    .map(m => ({ role: m.role, content: m.content }));

  const callbacks = {
    signal,
    onToken: (token) => writer.textDelta(token),
    onToolStart: (tool) => writer.toolInput(tool),
    onToolDone: (tool) => writer.toolOutput(tool),
    onConfirmRequired: (confirmation) => writer.data('confirmation', confirmation),
    onExamPreview: (exam) => writer.data('exam-preview', exam, storedExamPreview(exam)),
    onA2ui: (surface) => writer.data('a2ui', surface),
  };

  try {
    if (role === Authority.TEACHER) {
      await runTeacherAgent(history, user, callbacks);
    } else {
      await runStudentAgent(history, callbacks);
    }
  } finally {
    if (signal?.aborted) {
      // Hủy = quên hẳn lượt này: gỡ câu hỏi đã lưu ở trên và không ghi đoạn trả
      // lời dở, để lượt hỏi kế tiếp không mang theo ngữ cảnh đã bị bỏ.
      await chatRepo.deleteMessage(userMessageId);
    } else if (writer.text()) {
      await chatRepo.saveMessage(sessionId, 'assistant', writer.text(), writer.parts());
    }
  }
};

// Dòng chat_messages → UIMessage cho giao diện. Tin nhắn cũ chưa có parts thì chỉ có chữ.
export const toUiMessage = (row) => ({
  id: `db_${row.id}`,
  role: row.role,
  parts: row.parts ? JSON.parse(row.parts) : textParts(row.content),
  createdAt: row.created_at,
});

// Chạy (hoặc hủy) hành động đang chờ xác nhận mà không gọi model — chạy đúng bản giáo viên
// đã xem trước. Ghi cả lựa chọn lẫn kết quả vào lịch sử chat để lượt sau model vẫn biết việc
// đã làm; lỗi khi chạy cũng thành câu trả lời, vì nút đã bấm thì phải có hồi âm.
export const resolveConfirmation = async (actionId, accept, user) => {
  const action = takePendingAction(actionId, user.id);
  if (!action) throw new NotFoundError('Yêu cầu xác nhận đã hết hạn hoặc đã được xử lý');

  let reply = `Đã hủy: ${action.label}.`;
  if (accept) {
    try {
      reply = await action.run();
    } catch (err) {
      console.error(`[chat] confirm failed userId=${user.id} action="${action.label}"`, err);
      reply = `Không thực hiện được: ${action.label}. Thầy/cô thử lại giúp em nhé.`;
    }
  }

  const userText = accept ? 'Đồng ý' : 'Không, hủy';
  const { id: sessionId } = await chatRepo.getOrCreateSession(user.id);
  const userRowId = await chatRepo.saveMessage(sessionId, 'user', userText);
  const replyRowId = await chatRepo.saveMessage(sessionId, 'assistant', reply);
  console.log(`[chat] confirm userId=${user.id} accept=${accept} action="${action.label}"`);
  return {
    messages: [
      toUiMessage({ id: userRowId, role: 'user', content: userText }),
      toUiMessage({ id: replyRowId, role: 'assistant', content: reply }),
    ],
  };
};
