import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/dashboard.controller.js';
import * as studentCtrl from '../controllers/student.controller.js';

const router = Router();
router.use(authenticate);

router.get('/teacher', asyncHandler(ctrl.teacherDashboard));
router.post('/advice', asyncHandler(ctrl.getAiAdvice));
router.get('/student', asyncHandler(studentCtrl.studentDashboard));

export default router;
