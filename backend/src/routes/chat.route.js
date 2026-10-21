import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateChat, validateConfirmAction } from '../validation/chat.validation.js';
import {
  chat, getChatHistory, clearChatHistory, confirmAction,
} from '../controllers/chat.controller.js';

const router = Router();
router.use(authenticate);
router.get('/history', asyncHandler(getChatHistory));
router.delete('/history', asyncHandler(clearChatHistory));
router.post('/', validateChat, asyncHandler(chat));
router.post('/confirm/:actionId', validateConfirmAction, asyncHandler(confirmAction));

export default router;
