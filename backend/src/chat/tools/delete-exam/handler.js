import { z } from 'zod';
import * as examService from '../../../services/exam.service.js';
import * as examRepo from '../../../repositories/exam.repository.js';

// Xóa đề là xóa cứng, kéo theo câu hỏi, đáp án và bài làm — không khôi phục được.
// Prompt có dặn hỏi lại trước khi xóa nhưng model từng bỏ qua: được bảo "xóa đề vừa
// tạo" trong khi đề đó chưa hề được tạo, nó tự chọn một đề cũ trùng tên rồi xóa luôn.
//
// Nên chặn ở code: lần gọi đầu chỉ ghi nhận và trả thông tin đề để hỏi giáo viên; chỉ
// lần gọi ở một LƯỢT CHAT SAU (giáo viên đã trả lời) mới xóa thật. Gọi 2 lần trong
// cùng một lượt không lách được vì lượt chờ xác nhận được tạo trong chính lượt đó.
const CONFIRM_WINDOW_MS = 10 * 60 * 1000;
const pendingDeletes = new Map(); // `${teacherId}:${examId}` → thời điểm hỏi xác nhận

const schema = z.object({
  exam_id: z.number().int().positive(),
});

const isConfirmedInLaterTurn = (askedAt, turnStartedAt) =>
  askedAt != null && askedAt < turnStartedAt && Date.now() - askedAt < CONFIRM_WINDOW_MS;

export const handler = async (args, user, { turnStartedAt = Date.now() } = {}) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { exam_id } = parsed.data;

  const exam = await examRepo.findByIdWithTeacher(exam_id, user.id);
  if (!exam) {
    return {
      success: false,
      data: null,
      message: 'Đề thi không tồn tại hoặc không thuộc quyền quản lý của thầy/cô.',
      metadata: {},
    };
  }

  const key = `${user.id}:${exam_id}`;
  const askedAt = pendingDeletes.get(key);
  if (!isConfirmedInLaterTurn(askedAt, turnStartedAt)) {
    // Giữ mốc đã hỏi trong chính lượt này; mốc cũ đã hết hạn thì hỏi lại từ đầu.
    if (askedAt == null || askedAt < turnStartedAt) pendingDeletes.set(key, Date.now());
    return {
      success: false,
      data: { examId: exam_id, name: exam.name, requiresConfirmation: true },
      message:
        `CHƯA XÓA. Hãy hỏi thầy/cô xác nhận xóa đề "${exam.name}" (ID ${exam_id}) — ` +
        'xóa là mất luôn câu hỏi và bài làm của học sinh, không khôi phục được. ' +
        'Chỉ gọi lại delete_exam khi thầy/cô đồng ý rõ ràng ở tin nhắn tiếp theo.',
      metadata: { tool: 'delete_exam', userId: user.id },
    };
  }
  pendingDeletes.delete(key);

  try {
    await examService.deleteExam(exam_id);
  } catch (err) {
    return { success: false, data: null, message: err.message, metadata: {} };
  }

  return {
    success: true,
    data: { examId: exam_id, name: exam.name },
    message: `Đã xóa đề thi "${exam.name}" thành công.`,
    metadata: { tool: 'delete_exam', userId: user.id },
  };
};
