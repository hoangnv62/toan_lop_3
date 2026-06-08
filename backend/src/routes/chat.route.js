import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateChat } from '../validation/chat.validation.js';
import { chat, getChatHistory } from '../controllers/chat.controller.js';

const router = Router();
router.use(authenticate);
router.get('/history', asyncHandler(getChatHistory));
router.post('/', validateChat, asyncHandler(chat));

export default router;
