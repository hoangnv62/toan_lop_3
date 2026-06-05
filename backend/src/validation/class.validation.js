import { validate } from './validate-handler.js';
import {
  addClassSchema,
  updateClassSchema,
  assignExamSchema,
  updateAssignmentSchema,
  addStudentSchema,
  createAnnouncementSchema,
} from './schema/class.schema.js';

export const validateAddClass = validate({ body: addClassSchema });
export const validateUpdateClass = validate({ body: updateClassSchema });
export const validateAssignExam = validate({ body: assignExamSchema });
export const validateUpdateAssignment = validate({ body: updateAssignmentSchema });
export const validateAddStudent = validate({ body: addStudentSchema });
export const validateCreateAnnouncement = validate({ body: createAnnouncementSchema });
