import { z } from 'zod';
import * as classService from '../../../services/class.service.js';
import * as classRepo from '../../../repositories/class.repository.js';
import * as examRepo from '../../../repositories/exam.repository.js';

const schema = z.object({
  exam_id:    z.number().int().positive(),
  class_id:   z.number().int().positive(),
  time_limit: z.number().int().positive().optional(),
  open_time:  z.string().optional().nullable(),
  deadline:   z.string().optional().nullable(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { exam_id, class_id, time_limit = 1200, open_time = null, deadline = null } = parsed.data;

  // Chốt hạ ở tầng code: model không biết hôm nay là ngày nào nên từng giao đề
  // với deadline nằm ở quá khứ — học sinh mở ra là đã hết hạn, không làm được.
  // System prompt có nhắc ngày hiện tại, nhưng prompt thì model bỏ qua được.
  if (deadline) {
    const when = new Date(deadline);
    if (Number.isNaN(when.getTime())) {
      return {
        success: false, data: null, metadata: {},
        message: `Hạn nộp "${deadline}" không đúng định dạng ISO 8601 (ví dụ 2026-08-11T09:00:00).`,
      };
    }
    if (when.getTime() <= Date.now()) {
      return {
        success: false, data: null, metadata: {},
        message:
          `Hạn nộp ${deadline} đã ở quá khứ nên chưa giao đề. ` +
          'Hãy xác nhận lại với giáo viên xem hạn nộp là ngày nào, rồi giao lại.',
      };
    }
  }

  try {
    await classService.assignExam(class_id, user.id, exam_id, deadline, open_time, time_limit);
  } catch (err) {
    return { success: false, data: null, message: err.message, metadata: {} };
  }

  const [cls, exam] = await Promise.all([
    classRepo.findById(class_id),
    examRepo.findById(exam_id),
  ]);

  const minutes = Math.round(time_limit / 60);
  const deadlineText = deadline ? `Deadline: ${deadline}.` : 'Không giới hạn deadline.';

  return {
    success: true,
    data: { examId: exam_id, classId: class_id, timeLimit: time_limit, openTime: open_time, deadline },
    message: `Đã giao đề thi "${exam?.name ?? 'đã chọn'}" cho lớp "${cls?.class_name ?? 'đã chọn'}". Thời gian làm bài: ${minutes} phút. ${deadlineText}`,
    metadata: { tool: 'assign_exam_to_class', userId: user.id },
  };
};
