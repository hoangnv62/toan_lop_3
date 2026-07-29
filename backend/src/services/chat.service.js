import { runTeacherAgent } from '../chat/agent/teacher-agent.js';
import { runStudentAgent } from '../chat/agent/student-agent.js';
import { Authority } from '../constants/authority.js';
import * as chatRepo from '../repositories/chat.repository.js';

export const runChat = async (newUserContent, role, user, callbacks) => {
  const { signal } = callbacks;
  const { id: sessionId } = await chatRepo.getOrCreateSession(user.id);
  const userMessageId = await chatRepo.saveMessage(sessionId, 'user', newUserContent);

  const dbMessages = await chatRepo.getSessionMessages(sessionId);
  const history = dbMessages.map(m => ({ role: m.role, content: m.content }));

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
