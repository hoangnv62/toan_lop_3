import { query, queryOne, insert } from '../config/database.js';

export const getOrCreateSession = async (userId) => {
  const existing = await queryOne(
    'SELECT id, expires_at FROM chat_sessions WHERE user_id = :userId AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    { userId }
  );
  if (existing) return existing;
  const id = await insert(
    'INSERT INTO chat_sessions (user_id, expires_at) VALUES (:userId, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
    { userId }
  );
  return { id };
};

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

export const getActiveSession = (userId) =>
  queryOne(
    'SELECT id, expires_at FROM chat_sessions WHERE user_id = :userId AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    { userId }
  );

// Xóa hẳn mọi phiên chat của người dùng (kể cả phiên đã hết hạn còn sót lại),
// để lượt chat kế tiếp bắt đầu bằng ngữ cảnh trắng. Xóa message trước rồi mới
// xóa session — chat_messages tham chiếu session_id.
export const deleteUserSessions = async (userId) => {
  await query(
    `DELETE FROM chat_messages
     WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = :userId)`,
    { userId }
  );
  const result = await query('DELETE FROM chat_sessions WHERE user_id = :userId', { userId });
  return Number(result?.affectedRows ?? 0);
};
