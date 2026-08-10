import { runChat } from '../services/chat.service.js';
import { getChatErrorMessage } from '../chat/fallback-messages.js';
import * as chatRepo from '../repositories/chat.repository.js';
import { success } from '../utils/response.js';

export const chat = async (req, res) => {
  const { messages } = req.body;
  const role = req.user.role;
  const newUserContent = messages[messages.length - 1].content;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let streamedAny = false;
  const startedAt = Date.now();
  const elapsed = () => `${Date.now() - startedAt}ms`;

  console.log(`[chat] start userId=${req.user.id} role=${role} chars=${newUserContent.length}`);

  // Người dùng bấm "Dừng" (hoặc đóng tab) → client hủy request. Không hủy thì
  // model vẫn chạy tiếp và vẫn tính token dù không ai đọc.
  //
  // Phải nghe trên res, KHÔNG phải req: 'close' của req bắn ngay khi đọc xong body
  // (express.json đã tiêu thụ hết trước khi controller chạy), nên nghe ở đó thì
  // lượt chat nào cũng tự hủy ở 0ms rồi treo vì cả 2 nhánh return đều bỏ res.end().
  const abort = new AbortController();
  res.on('close', () => {
    // res.end() cũng làm bắn 'close' — chỉ coi là hủy khi response còn dang dở.
    if (res.writableEnded) return;
    console.warn(`[chat] aborted userId=${req.user.id} after=${elapsed()}`);
    abort.abort();
  });

  try {
    await runChat(newUserContent, role, req.user, {
      signal: abort.signal,
      onToken: (token) => {
        streamedAny = true;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      onToolStart: (data) => res.write(`event: tool_start\ndata: ${JSON.stringify(data)}\n\n`),
      onToolDone: (data) => res.write(`event: tool_done\ndata: ${JSON.stringify(data)}\n\n`),
    });
  } catch (err) {
    // Bị hủy thì không còn ai bên kia để nhận lời xin lỗi.
    if (abort.signal.aborted) return;

    console.error(`[chat] failed userId=${req.user.id} after=${elapsed()} streamed=${streamedAny}`);
    console.error('Chat error:', err);
    // Nếu model đã kịp trả một phần rồi mới hỏng, xuống dòng để câu xin lỗi
    // không dính liền vào chữ cuối của đoạn dở dang.
    const prefix = streamedAny ? '\n\n' : '';
    const message = prefix + getChatErrorMessage(role, err);
    res.write(`data: ${JSON.stringify({ token: message })}\n\n`);
  }

  if (abort.signal.aborted) return;
  console.log(`[chat] done userId=${req.user.id} total=${elapsed()} streamed=${streamedAny}`);
  res.write('data: [DONE]\n\n');
  res.end();
};

export const getChatHistory = async (req, res) => {
  const session = await chatRepo.getActiveSession(req.user.id);
  if (!session) {
    return success(res, { messages: [], expiresAt: null });
  }
  const rows = await chatRepo.getSessionMessages(session.id);
  const messages = rows.map(r => ({
    role: r.role,
    content: r.content,
    createdAt: r.created_at,
  }));
  success(res, { messages, expiresAt: session.expires_at });
};

// Bắt đầu cuộc trò chuyện mới: xóa phiên hiện tại để lượt chat kế tiếp không
// mang theo ngữ cảnh cũ. Phiên sống 24h nên không có việc này thì hội thoại hôm
// trước vẫn ảnh hưởng tới câu trả lời hôm sau.
export const clearChatHistory = async (req, res) => {
  await chatRepo.deleteUserSessions(req.user.id);
  console.log(`[chat] cleared userId=${req.user.id}`);
  success(res, null, 'Đã bắt đầu cuộc trò chuyện mới');
};
