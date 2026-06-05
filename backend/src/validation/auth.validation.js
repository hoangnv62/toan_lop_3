import { validate } from './validate-handler.js';
import {
  loginSchema,
  registerTeacherSchema,
  registerStudentSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './schema/auth.schema.js';

export const validateLogin = validate({ body: loginSchema });
export const validateRegisterTeacher = validate({ body: registerTeacherSchema });
export const validateRegisterStudent = validate({ body: registerStudentSchema });
export const validateUpdateProfile = validate({ body: updateProfileSchema });
export const validateChangePassword = validate({ body: changePasswordSchema });
