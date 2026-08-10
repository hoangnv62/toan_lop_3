import { runTeacherAgent } from '../chat/agent/teacher-agent.js';
import { runStudentAgent } from '../chat/agent/student-agent.js';
import { Authority } from '../constants/authority.js';
import * as chatRepo from '../repositories/chat.repository.js';

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

export const runChat = async (newUserContent, role, user, callbacks) => {
  const { signal } = callbacks;
  const { id: sessionId } = await chatRepo.getOrCreateSession(user.id);
  const userMessageId = await chatRepo.saveMessage(sessionId, 'user', newUserContent);

  const dbMessages = await chatRepo.getSessionMessages(sessionId, HISTORY_WINDOW);
  const history = dropUnansweredRequests(dbMessages)
    .map(m => ({ role: m.role, content: m.content }));

  let fullResponse = '';
  const wrappedCallbacks = {
    ...callbacks,
    onToken: (token) => {
      fullResponse += token;
      callbacks.onToken?.(token);
    },
  };

  try {
    if (role === Authority.TEACHER) {
      await runTeacherAgent(history, user, wrappedCallbacks);
    } else {
      await runStudentAgent(history, wrappedCallbacks);
    }
  } finally {
    if (signal?.aborted) {
      // Hủy = quên hẳn lượt này: gỡ câu hỏi đã lưu ở trên và không ghi đoạn trả
      // lời dở, để lượt hỏi kế tiếp không mang theo ngữ cảnh đã bị bỏ.
      await chatRepo.deleteMessage(userMessageId);
    } else if (fullResponse) {
      await chatRepo.saveMessage(sessionId, 'assistant', fullResponse);
    }
  }
};
