import { z } from 'zod';
import * as dashboardService from '../../../services/dashboard.service.js';
import * as classRepo from '../../../repositories/class.repository.js';

const schema = z.object({
  class_id: z.number().int().positive().optional(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { class_id } = parsed.data;
  const stats = await dashboardService.getStatsByTeacher(user.id, class_id ?? null);

  let classLabel = 'tổng hợp';
  if (class_id) {
    const cls = await classRepo.findById(class_id);
    classLabel = cls?.class_name ? `lớp ${cls.class_name}` : 'lớp đã chọn';
  }

  return {
    success: true,
    data: stats,
    message: `Thống kê ${classLabel}: ${stats.studentsSubmitted}/${stats.totalStudents} học sinh đã nộp bài, điểm trung bình ${stats.avgScore}/10.`,
    metadata: { tool: 'get_student_stats', userId: user.id },
  };
};
