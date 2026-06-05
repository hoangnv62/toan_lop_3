import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as ctrl from '../controllers/question-bank.controller.js';
import { validateQuestionBank } from '../validation/question-bank.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.listQuestions));
router.post('/', validateQuestionBank, asyncHandler(ctrl.createQuestion));
router.get('/sample-excel', ctrl.downloadSample);
router.post('/import-excel', upload.single('file'), asyncHandler(ctrl.importQuestions));
router.put('/:id', validateQuestionBank, asyncHandler(ctrl.updateQuestion));
router.delete('/:id', asyncHandler(ctrl.deleteQuestion));

export default router;
