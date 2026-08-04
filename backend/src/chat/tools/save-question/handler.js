import { z } from 'zod';
import * as qbService from '../../../services/question-bank.service.js';
import * as lessonRepo from '../../../repositories/lesson.repository.js';

const answerSchema = z.object({
  content:   z.string().min(1),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  content:     z.string().min(1),
  explanation: z.string().optional(),
  answers:     z.array(answerSchema).length(4, 'Mỗi câu hỏi phải có đúng 4 đáp án'),
});

const schema = z.object({
  // Thông điệp viết cho model đọc, không phải cho người dùng: nó là thứ quay lại
  // trong kết quả tool, nên phải nói rõ bước tiếp theo cần làm.
  lesson_id: z
    .number({ error: 'Thiếu lesson_id. Hãy gọi get_lessons để lấy ID bài học đúng rồi lưu lại.' })
    .int()
    .positive(),
  questions: z.array(questionSchema).min(1, 'Phải có ít nhất 1 câu hỏi'),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { questions, lesson_id } = parsed.data;

  // Model có thể đoán bừa một ID. Kiểm tra bài học có thật và thuộc về chính giáo
  // viên đang chat, nếu không thì trả lỗi để nó đi hỏi lại thay vì lưu sai chỗ.
  const lesson = await lessonRepo.findById(lesson_id);
  if (!lesson || lesson.teacher_id !== user.id) {
    return {
      success: false,
      data: null,
      message: `Không tìm thấy bài học có id=${lesson_id} của giáo viên này. Hãy gọi get_lessons để lấy danh sách bài học có thật, rồi hỏi giáo viên chọn đúng bài trước khi lưu.`,
      metadata: {},
    };
  }

  for (const q of questions) {
    const correctCount = q.answers.filter(a => a.isCorrect).length;
    if (correctCount !== 1) {
      return {
        success: false,
        data: null,
        message: `Câu hỏi "${q.content.slice(0, 40)}..." phải có đúng 1 đáp án đúng.`,
        metadata: {},
      };
    }
  }

  const count = await qbService.saveBatch(user.id, questions, lesson_id);

  return {
    success: true,
    data: { saved: count },
    message: `Đã lưu ${count} câu hỏi vào ngân hàng thành công.`,
    metadata: { tool: 'save_questions_to_bank', userId: user.id },
  };
};
