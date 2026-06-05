import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/student.controller.js';

const router = Router();
router.use(authenticate);

router.get('/search', asyncHandler(ctrl.searchStudents));
router.get('/:id/results', asyncHandler(ctrl.getStudentResults));
router.get('/:id/progress', asyncHandler(ctrl.getStudentProgress));

export default router;
