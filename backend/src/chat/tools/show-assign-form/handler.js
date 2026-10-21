import { z } from 'zod';
import * as examRepo from '../../../repositories/exam.repository.js';
import * as classService from '../../../services/class.service.js';
import { registerSurface } from '../../a2ui/surfaces.js';
import { buildAssignExamForm } from '../../a2ui/assign-exam-form.js';

const schema = z.object({
  exam_id: z.number().int().positive(),
  class_id: z.number().int().positive().optional(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }
  const { exam_id, class_id } = parsed.data;

  const exam = await examRepo.findByIdWithTeacher(exam_id, user.id);
  if (!exam) {
    return {
      success: false, data: null, metadata: {},
      message: 'Đề thi không tồn tại hoặc không thuộc quyền quản lý của thầy/cô.',
    };
  }
  const { items: classes } = await classService.getTeacherClasses(user.id, 1, 50);
  if (!classes.length) {
    return {
      success: false, data: null, metadata: {},
      message: 'Thầy/cô chưa có lớp học nào để giao bài.',
    };
  }

  // exam_id lưu ở server theo surfaceId — lúc giáo viên bấm "Giao bài" không tin examId từ client.
  const surfaceId = registerSurface({
    userId: user.id, kind: 'assign_exam', data: { examId: exam_id },
  });
  const preselected = classes.some(c => c.classId === class_id) ? class_id : null;

  return {
    success: true,
    data: { examId: exam_id, examName: exam.name },
    message:
      `Đã hiện form giao đề "${exam.name}" dưới câu trả lời. Chỉ cần mời thầy/cô điền form rồi ` +
      'bấm "Giao bài" — KHÔNG hỏi lại thời gian làm bài, giờ mở hay hạn nộp bằng chữ, và CHƯA ' +
      'gọi assign_exam_to_class.',
    metadata: { tool: 'show_assign_exam_form', userId: user.id },
    // Dành cho giao diện — agent gỡ ra trước khi đưa kết quả cho model.
    ui: {
      a2ui: {
        surfaceId,
        messages: buildAssignExamForm({ surfaceId, exam, classes, classId: preselected }),
      },
    },
  };
};
