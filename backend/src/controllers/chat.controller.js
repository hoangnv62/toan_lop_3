import { runChat } from '../services/chat.service.js';
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

  try {
    await runChat(newUserContent, role, req.user, {
      onToken: (token) => res.write(`data: ${JSON.stringify({ token })}\n\n`),
      onToolStart: (data) => res.write(`event: tool_start\ndata: ${JSON.stringify(data)}\n\n`),
      onToolDone: (data) => res.write(`event: tool_done\ndata: ${JSON.stringify(data)}\n\n`),
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.write(`data: ${JSON.stringify({ token: 'Xin lỗi, tôi gặp lỗi rồi. Vui lòng thử lại!' })}\n\n`);
  }

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
