import { z } from 'zod';
import * as classService from '../../../services/class.service.js';

const schema = z.object({
  title:     z.string().min(1).max(255),
  content:   z.string().min(1).max(2000),
  class_ids: z.array(z.number().int().positive()).min(1),
});

export const handler = async (args, user) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { title, content, class_ids } = parsed.data;

  const sentClassIds = [];
  const failedDetails = [];

  for (const classId of class_ids) {
    try {
      await classService.createAnnouncement(classId, user.id, title, content);
      sentClassIds.push(classId);
    } catch (err) {
      failedDetails.push({ classId, reason: err.message });
    }
  }

  const sent = sentClassIds.length;
  const failed = failedDetails.length;
  const success = failed === 0;

  const message = failed === 0
    ? `Đã gửi thông báo "${title}" đến ${sent} lớp thành công.`
    : `Đã gửi thông báo "${title}" đến ${sent}/${class_ids.length} lớp. ${failed} lớp thất bại.`;

  return {
    success,
    data: { sent, failed, sentClassIds, failedDetails },
    message,
    metadata: { tool: 'create_announcement', userId: user.id },
  };
};
