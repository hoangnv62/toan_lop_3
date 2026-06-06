import { z } from 'zod';
import * as examService from '../../../services/exam.service.js';

const schema = z.object({
  exam_id: z.number().int().positive(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const stats = await examService.getStatsForTeacher(parsed.data.exam_id, user.user_id);

  return {
    success: true,
    data: stats,
    message: `Thống kê đề "${stats.examName}": ${stats.completedStudents}/${stats.totalStudents} HS nộp bài, điểm TB ${stats.avgScore}/10.`,
    metadata: { tool: 'get_exam_stats', userId: user.user_id },
  };
};
