import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as questionBankController from '../controllers/question-bank.controller.js';
import {
  validateQuestionBank,
  validateQuestionBankBulkDelete,
  validateQuestionBankGenerate,
  validateQuestionBankBatch,
} from '../validation/question-bank.validation.js';
import {isTeacher} from "../middleware/authorize.middleware.js";

const router = Router();
router.use(authenticate, isTeacher);

router.get('/', asyncHandler(questionBankController.listQuestions));
router.post('/', validateQuestionBank, asyncHandler(questionBankController.createQuestion));
router.post('/generate', validateQuestionBankGenerate, asyncHandler(questionBankController.generateQuestions));
router.post('/batch', validateQuestionBankBatch, asyncHandler(questionBankController.saveQuestionsBatch));
router.get('/sample-excel', questionBankController.downloadSample);
router.post('/import-excel', upload.single('file'), asyncHandler(questionBankController.importQuestions));
router.put('/:id', validateQuestionBank, asyncHandler(questionBankController.updateQuestion));
router.delete('/', validateQuestionBankBulkDelete, asyncHandler(questionBankController.deleteQuestions));
router.delete('/:id', asyncHandler(questionBankController.deleteQuestion));

export default router;
