import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/lesson.controller.js';
import * as examCtrl from '../controllers/exam.controller.js';
import { validateLesson } from '../validation/lesson.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.getLessons));
router.post('/', validateLesson, asyncHandler(ctrl.createLesson));
router.get('/:id', asyncHandler(ctrl.getLesson));
router.put('/:id', validateLesson, asyncHandler(ctrl.updateLesson));
router.delete('/:id', asyncHandler(ctrl.deleteLesson));

router.post('/:lessonId/exams', asyncHandler(examCtrl.createExam));
router.put('/:lessonId/exams/:examId', asyncHandler(examCtrl.updateExam));

export default router;
