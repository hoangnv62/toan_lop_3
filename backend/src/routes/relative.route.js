import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { isStudent } from '../middleware/authorize.middleware.js';
import * as ctrl from '../controllers/relative.controller.js';
import { validateRelative } from '../validation/relative.validation.js';

const router = Router();
router.use(authenticate);

// Xem: học sinh (của mình) hoặc giáo viên (học sinh lớp mình) — kiểm tra ở service.
// Thêm/sửa/xóa: chỉ học sinh tự quản lý người thân của mình.
router.get('/students/:studentId/relatives', asyncHandler(ctrl.getRelatives));
router.post(
  '/students/:studentId/relatives', isStudent, validateRelative, asyncHandler(ctrl.addRelative),
);
router.put('/relatives/:id', isStudent, validateRelative, asyncHandler(ctrl.updateRelative));
router.delete('/relatives/:id', isStudent, asyncHandler(ctrl.deleteRelative));

export default router;
