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

export const saveMessage = (sessionId, role, content) =>
  insert(
    'INSERT INTO chat_messages (session_id, role, content) VALUES (:sessionId, :role, :content)',
    { sessionId, role, content }
  );

// Dùng khi người dùng hủy giữa chừng: câu hỏi đã lưu trước khi gọi model nên
// phải gỡ ra, nếu không nó vẫn nằm trong ngữ cảnh của lượt hỏi kế tiếp.
export const deleteMessage = (id) =>
  query('DELETE FROM chat_messages WHERE id = :id', { id });

export const getSessionMessages = (sessionId) =>
  query(
    'SELECT role, content, created_at FROM chat_messages WHERE session_id = :sessionId ORDER BY created_at ASC',
    { sessionId }
  );

export const getActiveSession = (userId) =>
  queryOne(
    'SELECT id, expires_at FROM chat_sessions WHERE user_id = :userId AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    { userId }
  );
