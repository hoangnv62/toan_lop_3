import { z } from 'zod';
import * as studentService from '../../../services/student.service.js';
import * as classRepo from '../../../repositories/class.repository.js';
import { queryOne } from '../../../config/database.js';

const schema = z.object({
  student_id: z.number().int().positive().optional(),
  class_id:   z.number().int().positive().optional(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { student_id, class_id } = parsed.data;

  if (!student_id && !class_id) {
    return {
      success: false,
      data: null,
      message: 'Vui lòng cung cấp student_id hoặc class_id để xem tiến độ.',
      metadata: {},
    };
  }

  if (student_id) {
    const student = await queryOne(
      `SELECT u.id FROM users u
       JOIN classes c ON c.id = u.class_id
       WHERE u.id = :sid AND u.role = 'student' AND c.teacher_id = :tid`,
      { sid: student_id, tid: user.id }
    );
    if (!student) {
      return {
        success: false,
        data: null,
        message: 'Học sinh không tồn tại hoặc không thuộc lớp của thầy/cô.',
        metadata: {},
      };
    }

    const scores = await studentService.getStudentProgress(student_id);
    return {
      success: true,
      data: { studentId: student_id, scores },
      message: scores.length
        ? `Học sinh có ${scores.length} bài đã nộp.`
        : 'Học sinh chưa nộp bài nào.',
      metadata: { tool: 'get_student_progress', userId: user.id },
    };
  }

  const cls = await classRepo.findByIdAndTeacher(class_id, user.id);
  if (!cls) {
    return {
      success: false,
      data: null,
      message: 'Lớp không tồn tại hoặc không thuộc quyền quản lý của thầy/cô.',
      metadata: {},
    };
  }

  const rows = await classRepo.getStudentsWithScores(class_id);
  const students = rows.map(r => ({
    studentId: Number(r.id),
    name:      r.name,
    avgScore:  r.avg_score != null ? parseFloat(r.avg_score) : null,
  }));

  return {
    success: true,
    data: { classId: class_id, students },
    message: `Lớp có ${students.length} học sinh.`,
    metadata: { tool: 'get_student_progress', userId: user.id },
  };
};
