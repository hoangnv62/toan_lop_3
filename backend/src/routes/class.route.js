import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as ctrl from '../controllers/class.controller.js';
import * as studentCtrl from '../controllers/student.controller.js';
import {
  validateAddClass,
  validateUpdateClass,
  validateAssignExam,
  validateUpdateAssignment,
  validateAddStudent,
  validateCreateAnnouncement,
} from '../validation/class.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.getTeacherClasses));
router.post('/', validateAddClass, asyncHandler(ctrl.addClass));
router.get('/:id', asyncHandler(ctrl.getClassDetail));
router.put('/:id', validateUpdateClass, asyncHandler(ctrl.updateClass));
router.delete('/:id', asyncHandler(ctrl.deleteClass));

router.get('/:id/exams', asyncHandler(ctrl.getClassExams));
router.post('/:id/exams', validateAssignExam, asyncHandler(ctrl.assignExam));
router.put('/:id/exams/:examId', validateUpdateAssignment, asyncHandler(ctrl.updateExamAssignment));
router.delete('/:id/exams/:examId', asyncHandler(ctrl.unassignExam));

router.get('/:id/students', asyncHandler(ctrl.getStudentsWithScores));
router.get('/:id/students/export', asyncHandler(ctrl.exportStudents));
router.post('/:classId/students', validateAddStudent, asyncHandler(studentCtrl.addToClass));
router.post('/:classId/students/upload', upload.single('file'), asyncHandler(studentCtrl.uploadStudents));
router.delete('/:classId/students/:studentId', asyncHandler(studentCtrl.removeFromClass));

router.get('/:id/announcements', asyncHandler(ctrl.getAnnouncements));
router.post('/:id/announcements', validateCreateAnnouncement, asyncHandler(ctrl.createAnnouncement));

export default router;
