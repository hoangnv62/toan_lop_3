import { z } from 'zod';
import { RELATIONSHIPS } from '../../constants/relationship.js';

// Form gửi '' khi bỏ trống trường tuỳ chọn — coi như không nhập.
const emptyToNull = (value) => (typeof value === 'string' && value.trim() === '' ? null : value);

// Giới hạn độ dài khớp với cột trong bảng student_relatives.
export const relativeSchema = z.object({
  name: z.string().trim()
    .min(1, 'Tên không được trống')
    .max(100, 'Tên tối đa 100 ký tự'),
  phone: z.string().trim()
    .min(1, 'Số điện thoại không được trống')
    .transform((value) => value.replace(/[\s.-]/g, ''))
    .pipe(z.string().regex(/^\+?\d{9,15}$/, 'Số điện thoại không hợp lệ')),
  email: z.preprocess(
    emptyToNull,
    z.string().trim().max(100, 'Email tối đa 100 ký tự').email('Email không hợp lệ').nullable(),
  ).optional().default(null),
  relationship: z.preprocess(
    emptyToNull,
    z.enum(RELATIONSHIPS, { message: 'Quan hệ không hợp lệ' }).nullable(),
  ).optional().default(null),
});
