import { z } from 'zod';
import * as classService from '../../../services/class.service.js';
import * as classRepo from '../../../repositories/class.repository.js';
import * as relativeRepo from '../../../repositories/relative.repository.js';
import { isEmailConfigured } from '../../../utils/email.utils.js';
import { consumeConfirmation, requestConfirmation } from '../confirmation.js';

const schema = z.object({
  title:     z.string().trim().min(1).max(255),
  content:   z.string().trim().min(1).max(2000),
  class_ids: z.array(z.number().int().positive()).min(1),
});

// Lượt xác nhận, model phải gọi lại với đúng nội dung đã cho giáo viên xem. So sau khi gộp
// khoảng trắng để chênh một dấu cách không bắt hỏi lại; khác chữ thì là nội dung mới → hỏi lại.
const normalizeText = (text) => text.replace(/\s+/g, ' ').trim();
const confirmationKey = (userId, { title, content, class_ids }) =>
  ['create_announcement', userId, [...class_ids].sort((a, b) => a - b).join(','),
    normalizeText(title), normalizeText(content)].join(':');

const countRecipients = async (classIds) => {
  const lists = await Promise.all(classIds.map(id => relativeRepo.getEmailsByClassId(id)));
  return lists.reduce((total, list) => total + list.length, 0);
};

// Nói rõ email có thật sự đi hay không — model từng báo "đã gửi email cho phụ huynh" khi
// máy chủ chưa cấu hình SMTP và cũng không có phụ huynh nào có email.
const describeEmailDelivery = (recipients) => {
  if (!isEmailConfigured()) return 'KHÔNG gửi email (máy chủ chưa cấu hình SMTP)';
  if (recipients === 0) return 'KHÔNG gửi email (chưa phụ huynh nào khai báo email)';
  return `gửi email tới ${recipients} phụ huynh`;
};

// Đăng lần lượt từng lớp; một lớp lỗi không chặn các lớp còn lại.
const postToClasses = async (classIds, teacherId, title, content) => {
  const sentClassIds = [];
  const failedDetails = [];
  for (const classId of classIds) {
    try {
      await classService.createAnnouncement(classId, teacherId, title, content);
      sentClassIds.push(classId);
    } catch (err) {
      failedDetails.push({ classId, reason: err.message });
    }
  }
  return { sentClassIds, failedDetails };
};

// Gửi thật — dùng chung cho đường gõ "đồng ý" (model gọi lại tool) và nút bấm "Đồng ý".
const sendAnnouncement = async ({ classIds, teacherId, title, content, emailDelivery }) => {
  const { sentClassIds, failedDetails } = await postToClasses(classIds, teacherId, title, content);
  const sent = sentClassIds.length;
  const failed = failedDetails.length;

  const message = (failed === 0
    ? `Đã đăng thông báo "${title}" lên ${sent} lớp thành công`
    : `Đã đăng thông báo "${title}" lên ${sent}/${classIds.length} lớp, ${failed} lớp thất bại`)
    + `; ${emailDelivery}.`;

  return {
    success: failed === 0,
    data: { sent, failed, sentClassIds, failedDetails, emailDelivery },
    message,
    metadata: { tool: 'create_announcement', userId: teacherId },
  };
};

export const handler = async (args, user, { turnStartedAt = Date.now() } = {}) => {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { success: false, data: null, message: parsed.error.issues[0].message, metadata: {} };
  }

  const { title, content, class_ids } = parsed.data;
  const classIds = [...new Set(class_ids)];

  const classes = await Promise.all(classIds.map(id => classRepo.findByIdAndTeacher(id, user.id)));
  const notOwned = classIds.filter((_, i) => !classes[i]);
  if (notOwned.length) {
    return {
      success: false,
      data: { notOwnedClassIds: notOwned },
      message: `Lớp ID ${notOwned.join(', ')} không tồn tại hoặc không thuộc quyền quản lý của thầy/cô.`,
      metadata: {},
    };
  }

  // Thông báo vừa hiện cho cả lớp vừa gửi email ngay cho phụ huynh — gửi rồi không thu
  // hồi được, mà nội dung lại do model soạn. Phải để giáo viên đọc đúng bản sẽ gửi.
  const recipients = await countRecipients(classIds);
  const emailDelivery = describeEmailDelivery(recipients);
  const announcement = { classIds, teacherId: user.id, title, content, emailDelivery };
  const key = confirmationKey(user.id, parsed.data);
  if (!consumeConfirmation(key, turnStartedAt)) {
    const classNames = classes.map(c => c.class_name).join(', ');
    const actionId = requestConfirmation({
      key,
      userId: user.id,
      label: `Gửi thông báo "${title}" tới lớp ${classNames}`,
      run: async () => (await sendAnnouncement(announcement)).message,
    }, turnStartedAt);
    return {
      success: false,
      data: {
        title, content, classIds, classNames, emailDelivery, requiresConfirmation: true,
        confirmation: { actionId, label: `Gửi thông báo "${title}"` },
      },
      message:
        `CHƯA GỬI. Hãy cho thầy/cô xem NGUYÊN VĂN tiêu đề và nội dung dưới đây, nêu lớp nhận ` +
        `(${classNames}) và việc email (${emailDelivery}), rồi hỏi xác nhận. ` +
        'Chỉ gọi lại create_announcement với ĐÚNG tiêu đề, nội dung, class_ids này khi thầy/cô ' +
        'đồng ý rõ ràng ở tin nhắn tiếp theo; thầy/cô muốn sửa thì gọi với nội dung mới để hỏi lại.\n' +
        `Tiêu đề: ${title}\nNội dung: ${content}`,
      metadata: { tool: 'create_announcement', userId: user.id },
    };
  }

  return sendAnnouncement(announcement);
};
