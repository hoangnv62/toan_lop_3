import { runTeacherAgent } from '../chat/agent/teacher-agent.js';
import { runStudentAgent } from '../chat/agent/student-agent.js';
import { Authority } from '../constants/authority.js';
import * as chatRepo from '../repositories/chat.repository.js';

export const runChat = async (newUserContent, role, user, callbacks) => {
  const { id: sessionId } = await chatRepo.getOrCreateSession(user.id);
  await chatRepo.saveMessage(sessionId, 'user', newUserContent);

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

  if (role === Authority.TEACHER) {
    await runTeacherAgent(history, user, wrappedCallbacks);
  } else {
    await runStudentAgent(history, wrappedCallbacks);
  }

  if (fullResponse) {
    await chatRepo.saveMessage(sessionId, 'assistant', fullResponse);
  }
};
