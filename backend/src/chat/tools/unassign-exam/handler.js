import { z } from 'zod';
import * as classService from '../../../services/class.service.js';
import * as classRepo from '../../../repositories/class.repository.js';
import * as examRepo from '../../../repositories/exam.repository.js';

const schema = z.object({
  exam_id:  z.number().int().positive(),
  class_id: z.number().int().positive(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { exam_id, class_id } = parsed.data;

  try {
    await classService.unassignExam(class_id, user.id, exam_id);
  } catch (err) {
    return { success: false, data: null, message: err.message, metadata: {} };
  }

  const [cls, exam] = await Promise.all([
    classRepo.findById(class_id),
    examRepo.findById(exam_id),
  ]);

  return {
    success: true,
    data: { examId: exam_id, classId: class_id },
    message: `Đã hủy giao đề thi "${exam?.name ?? 'đã chọn'}" khỏi lớp "${cls?.class_name ?? 'đã chọn'}".`,
    metadata: { tool: 'unassign_exam', userId: user.id },
  };
};
