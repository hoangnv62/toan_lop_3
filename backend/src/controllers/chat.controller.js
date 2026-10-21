import * as chatService from '../services/chat.service.js';
import { handleA2uiAction } from '../services/chat-a2ui.service.js';
import { createUiMessageWriter, textOfParts, UI_MESSAGE_STREAM_HEADER } from '../chat/ui-message.js';
import { getChatErrorMessage } from '../chat/fallback-messages.js';
import { success } from '../utils/response.js';

// Trả lời theo giao thức "UI Message Stream" (Vercel AI SDK) — xem src/chat/ui-message.js.
export const chat = async (req, res) => {
  const role = req.user.role;
  const newUserContent = textOfParts(req.body.messages.at(-1).parts);
  // Trước khi mở SSE: sessionId sai / của người khác thì trả 404 JSON như mọi API khác.
  const session = await chatService.resolveChatSession(req.user, req.body.sessionId, newUserContent);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader(...UI_MESSAGE_STREAM_HEADER);
  res.flushHeaders();

  const startedAt = Date.now();
  const elapsed = () => `${Date.now() - startedAt}ms`;
  const writer = createUiMessageWriter((chunk) => res.write(`data: ${JSON.stringify(chunk)}\n\n`));

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
    await chatService.runChat(newUserContent, role, req.user, { signal: abort.signal, writer, session });
  } catch (err) {
    // Bị hủy thì không còn ai bên kia để nhận lời xin lỗi.
    if (abort.signal.aborted) return;
    console.error(`[chat] failed userId=${req.user.id} after=${elapsed()} streamed=${!!writer.text()}`);
    console.error('Chat error:', err);
    writer.error(getChatErrorMessage(role, err));
  }

  if (abort.signal.aborted) return;
  console.log(`[chat] done userId=${req.user.id} total=${elapsed()} streamed=${!!writer.text()}`);
  writer.finish();
  res.write('data: [DONE]\n\n');
  res.end();
};

// ── Lịch sử hội thoại ──────────────────────────────────────────────────────

export const listChatSessions = async (req, res) => {
  success(res, await chatService.listSessions(req.user));
};

export const getChatSession = async (req, res) => {
  success(res, await chatService.getSession(req.user, req.params.sessionId));
};

export const renameChatSession = async (req, res) => {
  success(res, await chatService.renameSession(req.user, req.params.sessionId, req.body.title));
};

export const deleteChatSession = async (req, res) => {
  await chatService.deleteSession(req.user, req.params.sessionId);
  success(res, null, 'Đã xóa cuộc trò chuyện');
};

// Giáo viên bấm nút Đồng ý / Không dưới câu hỏi xác nhận của chatbot.
export const confirmAction = async (req, res) => {
  const { accept, sessionId } = req.body;
  success(res, await chatService.resolveConfirmation(req.params.actionId, accept, req.user, sessionId));
};

// Giáo viên bấm nút trên form A2UI do chatbot gửi (vd. "Giao bài").
export const a2uiAction = async (req, res) => {
  success(res, await handleA2uiAction(req.body, req.user));
};
