import { runTeacherAgent } from '../chat/agent/teacher-agent.js';
import { runStudentAgent } from '../chat/agent/student-agent.js';

export const runChat = (messages, role, user, callbacks) => {
  if (role === 'teacher') {
    return runTeacherAgent(messages, user, callbacks);
  }
  return runStudentAgent(messages, callbacks);
};
