import * as classService from '../../../services/class.service.js';

export const handler = async (_args, user) => {
  const result = await classService.getTeacherClasses(user.user_id, 1, 50);

  const classes = result.items.map(r => ({
    classId:       r.classId,
    className:     r.className,
    totalStudents: r.totalStudents,
    avgScore:      r.avgScore,
  }));

  return {
    success: true,
    data: { classes, total: result.total },
    message: classes.length
      ? `Có ${classes.length} lớp học.`
      : 'Chưa có lớp học nào.',
    metadata: { tool: 'get_classes', userId: user.user_id },
  };
};
