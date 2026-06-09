import { z } from 'zod';
import * as examService from '../../../services/exam.service.js';
import * as classService from '../../../services/class.service.js';
import * as examRepo from '../../../repositories/exam.repository.js';

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
  exam_id:     z.number().int().positive(),
  name:        z.string().min(1).optional(),
  description: z.string().optional(),
  questions:   z.array(questionSchema).min(1).optional(),
  class_id:    z.number().int().positive().optional(),
  time_limit:  z.number().int().positive().optional(),
  deadline:    z.string().optional().nullable(),
  open_time:   z.string().optional().nullable(),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { exam_id, name, description, questions, class_id, time_limit, deadline, open_time } = parsed.data;

  const hasContentUpdate = name !== undefined || description !== undefined || questions !== undefined;
  const hasAssignmentUpdate = class_id !== undefined && (
    time_limit !== undefined || deadline !== undefined || open_time !== undefined
  );

  if (!hasContentUpdate && !hasAssignmentUpdate) {
    return {
      success: false,
      data: null,
      message: 'Không có thông tin nào để cập nhật. Vui lòng cung cấp ít nhất một trường cần thay đổi.',
      metadata: {},
    };
  }

  const exam = await examRepo.findByIdWithTeacher(exam_id, user.id);
  if (!exam) {
    return {
      success: false,
      data: null,
      message: 'Đề thi không tồn tại hoặc không thuộc quyền quản lý của thầy/cô.',
      metadata: {},
    };
  }

  const updated = [];

  if (hasContentUpdate) {
    if (questions) {
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
    }

    let questionsData;
    if (questions) {
      questionsData = questions.map(q => ({
        questionContent: q.content,
        explanation:     q.explanation || null,
        answers:         q.answers.map(a => ({ content: a.content, isCorrected: a.isCorrect })),
      }));
    } else {
      const current = await examRepo.findWithQuestions(exam_id);
      if (!current) {
        return { success: false, data: null, message: 'Không thể đọc câu hỏi hiện tại của đề thi.', metadata: {} };
      }
      questionsData = (current.questions || []).map(q => ({
        questionId:      Number(q.id),
        questionContent: q.content,
        explanation:     q.explanation || null,
        answers:         (q.answers || []).map(a => ({
          answerId:   Number(a.id),
          content:    a.content,
          isCorrected: a.is_correct,
        })),
      }));
    }

    try {
      await examService.updateExam(
        exam_id,
        Number(exam.lesson_id),
        name ?? exam.name,
        description !== undefined ? description : exam.description,
        questionsData
      );
    } catch (err) {
      return { success: false, data: null, message: err.message, metadata: {} };
    }

    updated.push('content');
  }

  if (hasAssignmentUpdate) {
    try {
      await classService.updateAssignment(class_id, user.id, exam_id, deadline, open_time, time_limit);
    } catch (err) {
      return { success: false, data: null, message: err.message, metadata: {} };
    }
    updated.push('assignment');
  }

  const updatedLabels = {
    content:    'nội dung đề',
    assignment: 'thông tin giao đề',
  };
  const updatedText = updated.map(k => updatedLabels[k]).join(' và ');

  return {
    success: true,
    data: { examId: exam_id, updated },
    message: `Đã cập nhật ${updatedText} của đề thi "${exam.name}" thành công.`,
    metadata: { tool: 'update_exam', userId: user.id },
  };
};
