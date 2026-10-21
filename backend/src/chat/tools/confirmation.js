// Tool làm việc không rút lại được (xóa đề, gửi thông báo + email cho phụ huynh) phải qua
// 2 lượt chat: lần gọi đầu chỉ ghi nhận và trả thông tin để model hỏi giáo viên; chỉ lần
// gọi ở một LƯỢT CHAT SAU (giáo viên đã trả lời) mới làm thật. Prompt có dặn hỏi lại
// nhưng model từng bỏ qua, nên phải chặn ở code. Gọi 2 lần trong cùng một lượt không lách
// được vì mốc hỏi được tạo trong chính lượt đó.
//
// Lưu trong bộ nhớ tiến trình: backend chạy 1 tiến trình; khởi động lại thì chỉ mất các
// lần hỏi đang chờ, model hỏi lại là xong.
const CONFIRM_WINDOW_MS = 10 * 60 * 1000;
const pendingConfirmations = new Map(); // key → thời điểm hỏi xác nhận

// true: key đã được hỏi ở lượt trước và còn hạn → tiêu thụ luôn, được làm thật.
// false: ghi nhận lần hỏi (giữ mốc nếu đã hỏi trong chính lượt này) → phải hỏi giáo viên.
export const consumeConfirmation = (key, turnStartedAt) => {
  const askedAt = pendingConfirmations.get(key);
  const confirmed = askedAt != null
    && askedAt < turnStartedAt
    && Date.now() - askedAt < CONFIRM_WINDOW_MS;

  if (confirmed) {
    pendingConfirmations.delete(key);
    return true;
  }
  if (askedAt == null || askedAt < turnStartedAt) pendingConfirmations.set(key, Date.now());
  return false;
};
