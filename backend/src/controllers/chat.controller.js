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

  // Người dùng bấm "Dừng" (hoặc đóng tab) → client hủy request, Express bắn
  // 'close'. Không hủy thì model vẫn chạy tiếp và vẫn tính token dù không ai đọc.
  const abort = new AbortController();
  req.on('close', () => abort.abort());

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

    console.error('Chat error:', err);
    // Nếu model đã kịp trả một phần rồi mới hỏng, xuống dòng để câu xin lỗi
    // không dính liền vào chữ cuối của đoạn dở dang.
    const prefix = streamedAny ? '\n\n' : '';
    const message = prefix + getChatErrorMessage(role, err);
    res.write(`data: ${JSON.stringify({ token: message })}\n\n`);
  }

  if (abort.signal.aborted) return;
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
