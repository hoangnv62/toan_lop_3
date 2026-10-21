import { randomUUID } from 'crypto';

// Tool làm việc không rút lại được (xóa đề, gửi thông báo + email cho phụ huynh) phải được
// giáo viên xác nhận. Prompt có dặn hỏi lại nhưng model từng bỏ qua, nên chặn ở code:
// lần gọi đầu chỉ ghi nhận và trả bản xem trước. Sau đó có 2 đường xác nhận:
//   - Bấm nút "Đồng ý" trên khung chat → POST /api/chat/confirm/:actionId chạy thẳng hành
//     động đã lưu: không tốn lượt gọi model, và chạy đúng bản giáo viên đã xem.
//   - Gõ chữ "đồng ý" → model gọi lại tool ở LƯỢT SAU; gọi 2 lần trong cùng một lượt không
//     lách được vì mốc hỏi được tạo trong chính lượt đó.
//
// Lưu trong bộ nhớ tiến trình: backend chạy 1 tiến trình; khởi động lại thì chỉ mất các lần
// hỏi đang chờ, giáo viên yêu cầu lại là xong.
const CONFIRM_WINDOW_MS = 10 * 60 * 1000;
const pendingConfirmations = new Map(); // key → { askedAt, actionId }
const pendingActions = new Map();       // actionId → { key, userId, label, run }

const isFresh = (askedAt) => Date.now() - askedAt < CONFIRM_WINDOW_MS;

const forget = (key) => {
  const entry = pendingConfirmations.get(key);
  if (entry) pendingActions.delete(entry.actionId);
  pendingConfirmations.delete(key);
};

const sweepExpired = () => {
  for (const [key, entry] of pendingConfirmations) {
    if (!isFresh(entry.askedAt)) forget(key);
  }
};

// Đường gõ chữ: true khi key đã được hỏi ở lượt TRƯỚC và còn hạn → tiêu thụ luôn (nút bấm
// của cùng lần hỏi đó cũng hết hiệu lực, tránh chạy 2 lần).
export const consumeConfirmation = (key, turnStartedAt) => {
  const entry = pendingConfirmations.get(key);
  const confirmed = entry != null && entry.askedAt < turnStartedAt && isFresh(entry.askedAt);
  if (confirmed) forget(key);
  return confirmed;
};

// Ghi nhận lần hỏi kèm hành động sẽ chạy khi giáo viên bấm "Đồng ý". run() trả câu báo kết
// quả để ghi vào lịch sử chat. Đã hỏi trong chính lượt này thì dùng lại mã cũ.
// → { actionId, label, expiresAt } — gửi xuống giao diện thành part `data-confirmation`;
// expiresAt để giao diện ẩn nút khi đã quá hạn (kể cả sau khi tải lại trang).
export const requestConfirmation = ({ key, userId, label, run }, turnStartedAt) => {
  sweepExpired();
  let entry = pendingConfirmations.get(key);
  if (!entry || entry.askedAt < turnStartedAt) {
    forget(key);
    entry = { askedAt: Date.now(), actionId: randomUUID() };
    pendingConfirmations.set(key, entry);
    pendingActions.set(entry.actionId, { key, userId, label, run });
  }
  return { actionId: entry.actionId, label, expiresAt: entry.askedAt + CONFIRM_WINDOW_MS };
};

// Đường bấm nút: lấy ra (và xóa) hành động đang chờ của đúng người dùng; null khi không còn
// — đã hết hạn, đã xử lý (bấm rồi hoặc đã gõ "đồng ý"), hay là của người khác.
export const takePendingAction = (actionId, userId) => {
  const action = pendingActions.get(actionId);
  if (!action || action.userId !== userId) return null;
  const entry = pendingConfirmations.get(action.key);
  forget(action.key);
  return entry && isFresh(entry.askedAt) ? action : null;
};
