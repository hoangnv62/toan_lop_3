import { z } from 'zod';
import * as classService from '../../../services/class.service.js';
import * as classRepo from '../../../repositories/class.repository.js';
import * as examRepo from '../../../repositories/exam.repository.js';
import { NO_DEADLINE, OPEN_NOW, parseScheduleTime, validateSchedule } from '../schedule.js';

const schema = z.object({
  exam_id:    z.number().int().positive(),
  class_id:   z.number().int().positive(),
  time_limit: z.number().int().positive().optional(),
  open_time:  z.string().optional().nullable(),
  deadline:   z.string().optional().nullable(),
});

// Thời điểm mở / hạn nộp là tuỳ chọn ở schema SQL nhưng bắt buộc ở tool: để tuỳ chọn thì
// model chỉ hỏi thời gian làm bài rồi giao luôn, lặng lẽ bỏ qua 2 trường này.
// → { open_time, deadline } (giờ địa phương hoặc null) hoặc { error }
const resolveSchedule = ({ open_time: rawOpen, deadline: rawDeadline }) => {
  const missing = [
    rawOpen === undefined && 'thời điểm mở đề',
    rawDeadline === undefined && 'hạn nộp',
  ].filter(Boolean);
  if (missing.length) {
    return {
      error:
        `CHƯA GIAO — chưa có ${missing.join(' và ')}. Hãy hỏi thầy/cô (gợi ý: mở ngay, không ` +
        `giới hạn hạn nộp) rồi gọi lại; thầy/cô chọn mở ngay thì open_time="${OPEN_NOW}", ` +
        `không giới hạn thì deadline="${NO_DEADLINE}".`,
    };
  }

  const open = parseScheduleTime(rawOpen, OPEN_NOW, 'Thời điểm mở đề');
  const due = parseScheduleTime(rawDeadline, NO_DEADLINE, 'Hạn nộp');
  // Chốt ở tầng code: model không chắc hôm nay là ngày nào nên từng giao đề với hạn nộp ở
  // quá khứ — học sinh mở ra là đã hết hạn. Prompt có nhắc ngày nhưng model bỏ qua được.
  const error = open.error || due.error
    || validateSchedule({ openDate: open.date, deadlineDate: due.date });
  return error ? { error } : { open_time: open.value, deadline: due.value };
};

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { exam_id, class_id, time_limit = 1200 } = parsed.data;

  const schedule = resolveSchedule(parsed.data);
  if (schedule.error) return { success: false, data: null, metadata: {}, message: schedule.error };
  const { open_time, deadline } = schedule;

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
  const openText = open_time ? `Mở đề lúc: ${open_time}.` : 'Mở ngay.';
  const deadlineText = deadline ? `Hạn nộp: ${deadline}.` : 'Không giới hạn hạn nộp.';

  return {
    success: true,
    data: { examId: exam_id, classId: class_id, timeLimit: time_limit, openTime: open_time, deadline },
    message: `Đã giao đề thi "${exam?.name ?? 'đã chọn'}" cho lớp "${cls?.class_name ?? 'đã chọn'}". Thời gian làm bài: ${minutes} phút. ${openText} ${deadlineText}`,
    metadata: { tool: 'assign_exam_to_class', userId: user.id },
  };
};
