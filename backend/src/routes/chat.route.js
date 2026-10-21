import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateChat, validateConfirmAction, validateA2uiAction } from '../validation/chat.validation.js';
import {
  chat, getChatHistory, clearChatHistory, confirmAction, a2uiAction,
} from '../controllers/chat.controller.js';

const router = Router();
router.use(authenticate);
router.get('/history', asyncHandler(getChatHistory));
router.delete('/history', asyncHandler(clearChatHistory));
router.post('/', validateChat, asyncHandler(chat));
router.post('/confirm/:actionId', validateConfirmAction, asyncHandler(confirmAction));
router.post('/a2ui-action', validateA2uiAction, asyncHandler(a2uiAction));

export default router;
