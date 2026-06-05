import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as ctrl from '../controllers/question.controller.js';
import { validateGenerateQuestions } from '../validation/question.validation.js';

const router = Router();
router.use(authenticate);

router.post('/generate', validateGenerateQuestions, asyncHandler(ctrl.generateQuestions));
router.post('/import-excel', upload.single('file'), asyncHandler(ctrl.importQuestions));

export default router;
