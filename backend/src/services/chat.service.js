import { runTeacherAgent } from '../chat/agent/teacher-agent.js';
import { runStudentAgent } from '../chat/agent/student-agent.js';
import { Authority } from '../constants/authority.js';
import * as chatRepo from '../repositories/chat.repository.js';
import { takePendingAction } from '../chat/tools/confirmation.js';
import { BadRequestError, NotFoundError } from '../utils/error.utils.js';
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

const TITLE_LENGTH = 60;
const MAX_LISTED_SESSIONS = 100;
const MAX_TITLE_LENGTH = 120;

// Tiêu đề hội thoại = câu hỏi đầu tiên (cắt ngắn) — không nhờ model đặt tên để khỏi tốn quota.
const titleFrom = (text) => {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > TITLE_LENGTH ? `${oneLine.slice(0, TITLE_LENGTH - 1)}…` : oneLine;
};

// Hội thoại cho lượt chat này: sessionId có thì phải là của chính người dùng; không có thì mở hội
// thoại mới. Kiểm tra TRƯỚC khi mở SSE để sai sessionId trả 404 JSON bình thường.
export const resolveChatSession = async (user, sessionId, firstText) => {
  if (sessionId) {
    const session = await chatRepo.findUserSession(sessionId, user.id);
    if (!session) throw new NotFoundError('Không tìm thấy cuộc trò chuyện');
    return { id: session.id, title: session.title, isNew: false };
  }
  const title = titleFrom(firstText);
  return { id: await chatRepo.createSession(user.id, title), title, isNew: true };
};

// Nút xác nhận / form A2UI ghi kết quả vào hội thoại đang mở trên giao diện; không gửi kèm thì
// vào hội thoại gần nhất (có thể đã hết hạn hiển thị nhưng vẫn là nơi nút được bấm).
const followUpSession = async (user, sessionId) => {
  const session = sessionId
    ? await chatRepo.findUserSession(sessionId, user.id)
    : await chatRepo.findLatestUserSession(user.id);
  if (!session) throw new NotFoundError('Không tìm thấy cuộc trò chuyện');
  return session.id;
};

// Lưu một cặp tin nhắn (lựa chọn của giáo viên + kết quả) vào hội thoại, trả dạng UIMessage.
export const appendExchange = async (user, sessionId, userText, reply) => {
  const id = await followUpSession(user, sessionId);
  const userRowId = await chatRepo.saveMessage(id, 'user', userText);
  const replyRowId = await chatRepo.saveMessage(id, 'assistant', reply);
  await chatRepo.touchSession(id);
  return [
    toUiMessage({ id: userRowId, role: 'user', content: userText }),
    toUiMessage({ id: replyRowId, role: 'assistant', content: reply }),
  ];
};

// Dữ liệu đề đầy đủ chỉ cần lúc stream (nút bấm là hiện ngay); trong DB chỉ giữ examId, F5 xong
// bấm nút thì frontend tự gọi GET /api/exams/:id.
const storedExamPreview = ({ examId, name, questions }) =>
  ({ examId, name, questionCount: questions?.length ?? 0 });

// writer: createUiMessageWriter() do controller tạo — phát chunk xuống client và gom parts.
// session: kết quả resolveChatSession().
export const runChat = async (newUserContent, role, user, { signal, writer, session }) => {
  const sessionId = session.id;
  // Báo cho giao diện biết lượt này thuộc hội thoại nào (hội thoại mới vừa được tạo).
  writer.start({ sessionId, title: session.title });
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
      // lời dở, để lượt hỏi kế tiếp không mang theo ngữ cảnh đã bị bỏ. Hội thoại vừa tạo
      // cho chính câu hỏi này thì xóa luôn, khỏi để lại một mục rỗng trong lịch sử.
      await chatRepo.deleteMessage(userMessageId);
      if (session.isNew) await chatRepo.deleteUserSession(sessionId, user.id);
    } else {
      if (writer.text()) {
        await chatRepo.saveMessage(sessionId, 'assistant', writer.text(), writer.parts());
      }
      await chatRepo.touchSession(sessionId);
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
export const resolveConfirmation = async (actionId, accept, user, sessionId = null) => {
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
  const messages = await appendExchange(user, sessionId, userText, reply);
  console.log(`[chat] confirm userId=${user.id} accept=${accept} action="${action.label}"`);
  return { messages };
};

// ── Lịch sử hội thoại ──────────────────────────────────────────────────────

export const listSessions = async (user) =>
  (await chatRepo.listUserSessions(user.id, MAX_LISTED_SESSIONS)).map(s => ({
    id: s.id,
    title: s.title || 'Cuộc trò chuyện',
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    messageCount: Number(s.message_count),
  }));

export const getSession = async (user, sessionId) => {
  const session = await chatRepo.findUserSession(sessionId, user.id);
  if (!session) throw new NotFoundError('Không tìm thấy cuộc trò chuyện');
  const rows = await chatRepo.getSessionMessages(session.id);
  return {
    session: { id: session.id, title: session.title, updatedAt: session.updated_at },
    messages: rows.map(toUiMessage),
  };
};

export const renameSession = async (user, sessionId, rawTitle) => {
  const title = rawTitle.replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE_LENGTH);
  if (!title) throw new BadRequestError('Tên cuộc trò chuyện không được trống');
  const result = await chatRepo.renameUserSession(sessionId, user.id, title);
  if (!Number(result.affectedRows)) throw new NotFoundError('Không tìm thấy cuộc trò chuyện');
  return { id: sessionId, title };
};

export const deleteSession = async (user, sessionId) => {
  const result = await chatRepo.deleteUserSession(sessionId, user.id);
  if (!Number(result.affectedRows)) throw new NotFoundError('Không tìm thấy cuộc trò chuyện');
};
