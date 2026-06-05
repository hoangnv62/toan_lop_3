import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/exam.controller.js';
import { validateSubmitExam, validateSaveComment } from '../validation/exam.validation.js';

const router = Router();
router.use(authenticate);

router.get('/:id', asyncHandler(ctrl.getExam));
router.delete('/:id', asyncHandler(ctrl.deleteExam));
router.get('/:id/assignments', asyncHandler(ctrl.getExamAssignments));
router.post('/:id/clone', asyncHandler(ctrl.cloneExam));
router.post('/:id/submit', validateSubmitExam, asyncHandler(ctrl.submitExam));
router.get('/:id/result', asyncHandler(ctrl.getExamResult));
router.get('/:id/stats', asyncHandler(ctrl.getExamStats));
router.get('/:id/export', asyncHandler(ctrl.exportExamResults));
router.get('/:id/export-pdf', asyncHandler(ctrl.exportExamPdf));
router.get('/:id/submissions/:studentId', asyncHandler(ctrl.getStudentSubmission));
router.post('/:id/submissions/:studentId/comment', validateSaveComment, asyncHandler(ctrl.saveComment));
router.post('/:id/ai-feedback', asyncHandler(ctrl.aiExamFeedback));
router.post('/:id/ai-analysis', asyncHandler(ctrl.aiStatsAnalysis));

export default router;
