import { z } from 'zod';

const datetimeSchema = z.string().min(1, 'Thời gian không được trống').transform((val, ctx) => {
  const d = new Date(val.replace(' ', 'T'));
  if (isNaN(d.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Thời gian không hợp lệ' });
    return z.NEVER;
  }
  return d;
});

export const addClassSchema = z.object({
  className: z.string().min(1, 'Tên lớp không được trống'),
});

export const updateClassSchema = z.object({
  className: z.string().min(1, 'Tên lớp không được trống'),
});

export const assignExamSchema = z.object({
  examId: z.coerce.number({ invalid_type_error: 'Thiếu examId' }).int().positive('examId không hợp lệ'),
  timeLimit: z.coerce.number({ invalid_type_error: 'Thời gian làm bài không hợp lệ' }).int().positive('Thời gian làm bài phải lớn hơn 0'),
  deadline: datetimeSchema,
  openTime: datetimeSchema,
});

export const updateAssignmentSchema = z.object({
  timeLimit: z.coerce.number({ invalid_type_error: 'Thời gian làm bài không hợp lệ' }).int().positive('Thời gian làm bài phải lớn hơn 0'),
  deadline: datetimeSchema,
  openTime: datetimeSchema,
});

export const addStudentSchema = z.object({
  username: z.string().min(1, 'Thiếu username học sinh'),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được trống'),
  content: z.string().min(1, 'Nội dung không được trống'),
});
