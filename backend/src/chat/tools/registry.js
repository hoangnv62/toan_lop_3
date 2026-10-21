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

import { definition as showAssignFormDef } from './show-assign-form/definition.js';
import { handler as showAssignFormHandler } from './show-assign-form/handler.js';

import { definition as createLessonDef } from './create-lesson/definition.js';
import { handler as createLessonHandler } from './create-lesson/handler.js';

import { definition as updateLessonDef } from './update-lesson/definition.js';
import { handler as updateLessonHandler } from './update-lesson/handler.js';

import { definition as deleteLessonDef } from './delete-lesson/definition.js';
import { handler as deleteLessonHandler } from './delete-lesson/handler.js';

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
  showAssignFormDef,
  createLessonDef,
  updateLessonDef,
  deleteLessonDef,
];

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
  show_assign_exam_form:  showAssignFormHandler,
  create_lesson:          createLessonHandler,
  update_lesson:          updateLessonHandler,
  delete_lesson:          deleteLessonHandler,
};
