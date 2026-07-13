import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/auth.controller.js';
import {
  validateLogin,
  validateRegisterTeacher,
  validateRegisterStudent,
  validateUpdateProfile,
  validateChangePassword,
} from '../validation/auth.validation.js';

const router = Router();

router.post('/register/teacher', validateRegisterTeacher, asyncHandler(ctrl.registerTeacher));
router.post('/register/student', validateRegisterStudent, asyncHandler(ctrl.registerStudent));
router.post('/login', validateLogin, asyncHandler(ctrl.login));
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, asyncHandler(ctrl.me));
router.get('/profile', authenticate, asyncHandler(ctrl.getProfile));
router.put('/profile', authenticate, validateUpdateProfile, asyncHandler(ctrl.updateProfile));
router.put('/password', authenticate, validateChangePassword, asyncHandler(ctrl.changePassword));

export default router;
