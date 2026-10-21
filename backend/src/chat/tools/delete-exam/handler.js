import { z } from 'zod';
import * as examService from '../../../services/exam.service.js';
import * as examRepo from '../../../repositories/exam.repository.js';
import { consumeConfirmation, requestConfirmation } from '../confirmation.js';

const schema = z.object({
  exam_id: z.number().int().positive(),
});

const NOT_FOUND_MESSAGE = 'Đề thi không tồn tại hoặc không thuộc quyền quản lý của thầy/cô.';

// Kiểm tra lại quyền ngay lúc xóa: giữa lúc hỏi và lúc bấm nút, đề có thể đã bị xóa ở nơi khác.
const deleteOwnedExam = async (examId, teacherId) => {
  const exam = await examRepo.findByIdWithTeacher(examId, teacherId);
  if (!exam) return { success: false, data: null, message: NOT_FOUND_MESSAGE, metadata: {} };
  try {
    await examService.deleteExam(examId);
  } catch (err) {
    return { success: false, data: null, message: err.message, metadata: {} };
  }
  return {
    success: true,
    data: { examId, name: exam.name },
    message: `Đã xóa đề thi "${exam.name}" thành công.`,
    metadata: { tool: 'delete_exam', userId: teacherId },
  };
};

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
      message: NOT_FOUND_MESSAGE,
      metadata: {},
    };
  }

  // Xóa cứng, kéo theo câu hỏi, đáp án và bài làm — không khôi phục được. Model từng được
  // bảo "xóa đề vừa tạo" khi đề đó chưa hề được tạo, rồi tự chọn một đề cũ trùng tên mà xóa.
  const key = `delete_exam:${user.id}:${exam_id}`;
  if (!consumeConfirmation(key, turnStartedAt)) {
    const confirmation = requestConfirmation({
      key,
      userId: user.id,
      label: `Xóa đề "${exam.name}"`,
      run: async () => (await deleteOwnedExam(exam_id, user.id)).message,
    }, turnStartedAt);
    return {
      success: false,
      data: {
        examId: exam_id, name: exam.name, requiresConfirmation: true,
        confirmation,
      },
      message:
        `CHƯA XÓA. Hãy hỏi thầy/cô xác nhận xóa đề "${exam.name}" (ID ${exam_id}) — ` +
        'xóa là mất luôn câu hỏi và bài làm của học sinh, không khôi phục được. ' +
        'Chỉ gọi lại delete_exam khi thầy/cô đồng ý rõ ràng ở tin nhắn tiếp theo.',
      metadata: { tool: 'delete_exam', userId: user.id },
    };
  }

  return deleteOwnedExam(exam_id, user.id);
};
