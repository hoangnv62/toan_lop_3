import { query, queryOne, insert } from '../config/database.js';

// Mỗi chat_sessions là một cuộc trò chuyện trong lịch sử (schema.js, migrateChatSessionHistory).
export const createSession = (userId, title) =>
  insert('INSERT INTO chat_sessions (user_id, title) VALUES (:userId, :title)', { userId, title });

// null khi không có hoặc là hội thoại của người khác.
export const findUserSession = (sessionId, userId) =>
  queryOne(
    `SELECT id, title, created_at, updated_at FROM chat_sessions
     WHERE id = :sessionId AND user_id = :userId`,
    { sessionId, userId }
  );

export const findLatestUserSession = (userId) =>
  queryOne(
    `SELECT id, title, created_at, updated_at FROM chat_sessions
     WHERE user_id = :userId ORDER BY updated_at DESC, id DESC LIMIT 1`,
    { userId }
  );

export const listUserSessions = (userId, limit) =>
  query(
    `SELECT s.id, s.title, s.created_at, s.updated_at,
       (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id = s.id) AS message_count
     FROM chat_sessions s
     WHERE s.user_id = :userId
     ORDER BY s.updated_at DESC, s.id DESC
     LIMIT :limit`,
    { userId, limit }
  );

// Có tin nhắn mới → đưa hội thoại lên đầu lịch sử.
export const touchSession = (sessionId) =>
  query('UPDATE chat_sessions SET updated_at = NOW() WHERE id = :sessionId', { sessionId });

export const renameUserSession = (sessionId, userId, title) =>
  query(
    'UPDATE chat_sessions SET title = :title WHERE id = :sessionId AND user_id = :userId',
    { sessionId, userId, title }
  );

// chat_messages có FK ON DELETE CASCADE theo session_id → tin nhắn đi theo.
export const deleteUserSession = (sessionId, userId) =>
  query(
    'DELETE FROM chat_sessions WHERE id = :sessionId AND user_id = :userId',
    { sessionId, userId },
  );

// content: chữ thuần — đưa vào ngữ cảnh cho model. parts: UIMessage.parts — dựng lại giao diện
// (nút xác nhận, "Xem đề thi"...) sau khi tải lại trang. Bỏ trống thì coi như chỉ có chữ.
export const saveMessage = (sessionId, role, content, parts = null) =>
  insert(
    'INSERT INTO chat_messages (session_id, role, content, parts) VALUES (:sessionId, :role, :content, :parts)',
    { sessionId, role, content, parts: parts && JSON.stringify(parts) }
  );

// Tin nhắn trợ lý chứa form A2UI có surfaceId này — để đánh dấu form đã gửi.
export const findAssistantMessageBySurface = (userId, surfaceId) =>
  queryOne(
    `SELECT m.id, m.parts FROM chat_messages m
     JOIN chat_sessions s ON s.id = m.session_id
     WHERE s.user_id = :userId AND m.role = 'assistant' AND m.parts LIKE :pattern
     ORDER BY m.id DESC LIMIT 1`,
    { userId, pattern: `%${surfaceId}%` }
  );

export const updateMessageParts = (id, parts) =>
  query('UPDATE chat_messages SET parts = :parts WHERE id = :id', { id, parts: JSON.stringify(parts) });

// Dùng khi người dùng hủy giữa chừng: câu hỏi đã lưu trước khi gọi model nên
// phải gỡ ra, nếu không nó vẫn nằm trong ngữ cảnh của lượt hỏi kế tiếp.
export const deleteMessage = (id) =>
  query('DELETE FROM chat_messages WHERE id = :id', { id });

// created_at chỉ chính xác tới giây nên luôn sắp phụ theo id: câu hỏi gửi ngay trong giây
// trợ lý vừa trả lời xong mà xếp lên trước câu trả lời thì lượt cuối gửi cho model là của
// trợ lý → Gemini trả 400 "Requests ending with a model turn are not supported".
//
// limit = null: lấy hết, dùng cho việc hiển thị lại lịch sử trong giao diện.
// limit = N: chỉ lấy N tin mới nhất (vẫn trả về theo thứ tự cũ → mới) để dựng
// ngữ cảnh gửi cho model. Phiên sống 24h nên không giới hạn thì mỗi lượt chat
// gửi lại cả ngày hội thoại, càng về sau càng chậm và càng tốn token.
export const getSessionMessages = (sessionId, limit = null) => {
  if (!limit) {
    return query(
      'SELECT id, role, content, parts, created_at FROM chat_messages WHERE session_id = :sessionId ORDER BY created_at ASC, id ASC',
      { sessionId }
    );
  }
  // Lấy N tin cuối bằng DESC rồi đảo lại ở ngoài — MySQL không cho ORDER BY
  // ngược chiều ngay trong cùng một câu SELECT có LIMIT.
  return query(
    `SELECT id, role, content, parts, created_at FROM (
       SELECT id, role, content, parts, created_at FROM chat_messages
       WHERE session_id = :sessionId
       ORDER BY created_at DESC, id DESC
       LIMIT :limit
     ) AS recent
     ORDER BY created_at ASC, id ASC`,
    { sessionId, limit }
  );
};
