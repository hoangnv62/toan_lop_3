import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  validateChat, validateConfirmAction, validateA2uiAction,
  validateSessionParams, validateRenameSession,
} from '../validation/chat.validation.js';
import {
  chat, confirmAction, a2uiAction,
  listChatSessions, getChatSession, renameChatSession, deleteChatSession,
} from '../controllers/chat.controller.js';

const router = Router();
router.use(authenticate);
router.get('/sessions', asyncHandler(listChatSessions));
router.get('/sessions/:sessionId', validateSessionParams, asyncHandler(getChatSession));
router.patch('/sessions/:sessionId', validateRenameSession, asyncHandler(renameChatSession));
router.delete('/sessions/:sessionId', validateSessionParams, asyncHandler(deleteChatSession));
router.post('/', validateChat, asyncHandler(chat));
router.post('/confirm/:actionId', validateConfirmAction, asyncHandler(confirmAction));
router.post('/a2ui-action', validateA2uiAction, asyncHandler(a2uiAction));

export default router;
