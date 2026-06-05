import { z } from 'zod';

export const relativeSchema = z.object({
  name: z.string().min(1, 'Tên không được trống'),
  phone: z.string().min(1, 'Số điện thoại không được trống'),
  relationship: z.string().nullable().optional(),
});
