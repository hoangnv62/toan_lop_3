import { definition as searchDef } from './search-question/definition.js';
import { handler as searchHandler } from './search-question/handler.js';

import { definition as saveDef } from './save-question/definition.js';
import { handler as saveHandler } from './save-question/handler.js';

import { definition as statsDef } from './get-student-stats/definition.js';
import { handler as statsHandler } from './get-student-stats/handler.js';

import { definition as lessonsDef } from './get-lessons/definition.js';
import { handler as lessonsHandler } from './get-lessons/handler.js';

import { definition as classesDef } from './get-classes/definition.js';
import { handler as classesHandler } from './get-classes/handler.js';

import { definition as createExamDef } from './create-exam/definition.js';
import { handler as createExamHandler } from './create-exam/handler.js';

import { definition as examStatsDef } from './get-exam-stats/definition.js';
import { handler as examStatsHandler } from './get-exam-stats/handler.js';

import { definition as assignExamDef } from './assign-exam/definition.js';
import { handler as assignExamHandler } from './assign-exam/handler.js';

export const TEACHER_TOOLS = [
  searchDef,
  saveDef,
  statsDef,
  lessonsDef,
  classesDef,
  createExamDef,
  examStatsDef,
  assignExamDef,
];

export const TOOL_LABELS = {
  search_question_bank:   'Đang tìm câu hỏi trong ngân hàng...',
  save_questions_to_bank: 'Đang lưu câu hỏi vào ngân hàng...',
  get_student_stats:      'Đang lấy thống kê học sinh...',
  get_lessons:            'Đang lấy danh sách bài học...',
  get_classes:            'Đang lấy danh sách lớp học...',
  create_exam:            'Đang tạo đề thi...',
  get_exam_stats:         'Đang lấy thống kê đề thi...',
  assign_exam_to_class:   'Đang giao bài tập cho lớp...',
};

export const toolRegistry = {
  search_question_bank:   searchHandler,
  save_questions_to_bank: saveHandler,
  get_student_stats:      statsHandler,
  get_lessons:            lessonsHandler,
  get_classes:            classesHandler,
  create_exam:            createExamHandler,
  get_exam_stats:         examStatsHandler,
  assign_exam_to_class:   assignExamHandler,
};
