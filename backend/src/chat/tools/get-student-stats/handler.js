import { z } from 'zod';
import * as dashboardService from '../../../services/dashboard.service.js';

const schema = z.object({
  class_id: z.number().int().positive().optional(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { class_id } = parsed.data;
  const stats = await dashboardService.getStatsByTeacher(user.user_id, class_id ?? null);

  return {
    success: true,
    data: stats,
    message: class_id
      ? `Thống kê lớp ID ${class_id}: ${stats.studentsSubmitted}/${stats.totalStudents} học sinh đã nộp bài, điểm trung bình ${stats.avgScore}/10.`
      : `Thống kê tổng: ${stats.studentsSubmitted}/${stats.totalStudents} học sinh đã nộp bài, điểm trung bình ${stats.avgScore}/10.`,
    metadata: { tool: 'get_student_stats', userId: user.user_id },
  };
};
