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

import { definition as deleteExamDef } from './delete-exam/definition.js';
import { handler as deleteExamHandler } from './delete-exam/handler.js';

import { definition as unassignExamDef } from './unassign-exam/definition.js';
import { handler as unassignExamHandler } from './unassign-exam/handler.js';

import { definition as createAnnouncementDef } from './create-announcement/definition.js';
import { handler as createAnnouncementHandler } from './create-announcement/handler.js';

import { definition as studentProgressDef } from './get-student-progress/definition.js';
import { handler as studentProgressHandler } from './get-student-progress/handler.js';

import { definition as getExamsDef } from './get-exams/definition.js';
import { handler as getExamsHandler } from './get-exams/handler.js';

import { definition as updateExamDef } from './update-exam/definition.js';
import { handler as updateExamHandler } from './update-exam/handler.js';

export const TEACHER_TOOLS = [
  searchDef,
  saveDef,
  statsDef,
  lessonsDef,
  classesDef,
  getExamsDef,
  createExamDef,
  examStatsDef,
  assignExamDef,
  deleteExamDef,
  unassignExamDef,
  createAnnouncementDef,
  studentProgressDef,
  updateExamDef,
];

export const TOOL_LABELS = {
  search_question_bank:   'Đang tìm câu hỏi trong ngân hàng...',
  save_questions_to_bank: 'Đang lưu câu hỏi vào ngân hàng...',
  get_student_stats:      'Đang lấy thống kê học sinh...',
  get_lessons:            'Đang lấy danh sách bài học...',
  get_classes:            'Đang lấy danh sách lớp học...',
  get_exams:              'Đang lấy danh sách đề thi...',
  create_exam:            'Đang tạo đề thi...',
  get_exam_stats:         'Đang lấy thống kê đề thi...',
  assign_exam_to_class:   'Đang giao bài tập cho lớp...',
  delete_exam:            'Đang xóa đề thi...',
  unassign_exam:          'Đang hủy giao đề thi...',
  create_announcement:    'Đang gửi thông báo...',
  get_student_progress:   'Đang lấy tiến độ học sinh...',
  update_exam:            'Đang cập nhật đề thi...',
};

export const toolRegistry = {
  search_question_bank:   searchHandler,
  save_questions_to_bank: saveHandler,
  get_student_stats:      statsHandler,
  get_lessons:            lessonsHandler,
  get_classes:            classesHandler,
  get_exams:              getExamsHandler,
  create_exam:            createExamHandler,
  get_exam_stats:         examStatsHandler,
  assign_exam_to_class:   assignExamHandler,
  delete_exam:            deleteExamHandler,
  unassign_exam:          unassignExamHandler,
  create_announcement:    createAnnouncementHandler,
  get_student_progress:   studentProgressHandler,
  update_exam:            updateExamHandler,
};
