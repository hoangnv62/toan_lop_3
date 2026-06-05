import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { deleteAnnouncement } from '../controllers/class.controller.js';

const router = Router();
router.use(authenticate);

router.delete('/:annId', asyncHandler(deleteAnnouncement));

export default router;
