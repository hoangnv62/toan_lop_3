import { Authority } from '../constants/authority.js';

// Câu trả lời thay thế khi gọi model thất bại. Viết theo giọng của chính con bot
// (thầy/cô với giáo viên, "mình – bạn" với học sinh lớp 3) để người dùng không
// phải đọc thông báo lỗi kỹ thuật. Mỗi lần lấy ngẫu nhiên một câu cho đỡ nhàm.

const TEACHER_ERROR = [
  'Xin lỗi thầy/cô, có vẻ tôi vừa đánh rơi câu hỏi ở đâu đó mất rồi. Thầy/cô gửi lại giúp tôi nhé!',
  'Thầy/cô thông cảm, đầu tôi vừa trống mất một nhịp. Thầy/cô hỏi lại giúp tôi được không ạ?',
  'Tôi vừa gặp chút trục trặc khi suy nghĩ, chưa kịp trả lời thầy/cô. Thầy/cô thử gửi lại câu hỏi nhé!',
];

const STUDENT_ERROR = [
  'Ôi, hình như mình vừa làm rơi câu hỏi của bạn ở đâu mất rồi. Bạn hỏi lại giúp mình nhé!',
  'Hic, mình vừa bị lộn xộn một chút nên chưa trả lời được. Bạn gửi lại câu hỏi cho mình nha!',
  'Mình đang hơi lú, chưa nghĩ ra được câu trả lời. Bạn thử hỏi lại xem sao nhé!',
];

// Model free của OpenRouter rất hay bị rate-limit, tách riêng để người dùng biết
// là chờ chút sẽ được chứ không phải hỏng hẳn.
const TEACHER_BUSY = [
  'Hiện có hơi nhiều câu hỏi cùng lúc nên tôi chưa xử lý kịp. Thầy/cô đợi một chút rồi gửi lại giúp tôi nhé!',
  'Tôi đang quá tải một chút thầy/cô ạ. Thầy/cô chờ khoảng một phút rồi hỏi lại nhé!',
];

const STUDENT_BUSY = [
  'Mình đang bận trả lời nhiều bạn quá nên hơi chậm. Bạn đợi một chút rồi hỏi lại nhé!',
  'Đông bạn hỏi quá, mình chưa kịp nghĩ. Bạn chờ mình một lát rồi hỏi lại nha!',
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * Câu xin lỗi gửi cho người dùng khi lời gọi model hỏng.
 * @param {string} role - Authority.TEACHER hoặc Authority.STUDENT
 * @param {unknown} err - lỗi bắt được, dùng để nhận ra rate-limit (429)
 */
export function getChatErrorMessage(role, err) {
  const isTeacher = role === Authority.TEACHER;
  const isBusy = err?.status === 429;

  if (isBusy) return pick(isTeacher ? TEACHER_BUSY : STUDENT_BUSY);
  return pick(isTeacher ? TEACHER_ERROR : STUDENT_ERROR);
}
