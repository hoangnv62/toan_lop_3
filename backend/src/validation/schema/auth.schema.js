import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được trống'),
  password: z.string().min(1, 'Mật khẩu không được trống'),
});

export const registerTeacherSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được trống'),
  password: z.string().min(1, 'Mật khẩu không được trống'),
  fullName: z.string().min(1, 'Họ tên không được trống'),
});

export const registerStudentSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được trống'),
  password: z.string().min(1, 'Mật khẩu không được trống'),
  fullName: z.string().min(1, 'Họ tên không được trống'),
  dob: z.string().nullable().optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được trống'),
  dob: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});
