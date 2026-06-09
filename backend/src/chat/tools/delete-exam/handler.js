import { z } from 'zod';
import * as examService from '../../../services/exam.service.js';
import * as examRepo from '../../../repositories/exam.repository.js';

const schema = z.object({
  exam_id: z.number().int().positive(),
});

export const handler = async (args, user) => {
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
