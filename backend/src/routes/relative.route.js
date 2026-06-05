import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/relative.controller.js';
import { validateRelative } from '../validation/relative.validation.js';

const router = Router();
router.use(authenticate);

router.get('/students/:studentId/relatives', asyncHandler(ctrl.getRelatives));
router.post('/students/:studentId/relatives', validateRelative, asyncHandler(ctrl.addRelative));
router.put('/relatives/:id', validateRelative, asyncHandler(ctrl.updateRelative));
router.delete('/relatives/:id', asyncHandler(ctrl.deleteRelative));

export default router;
