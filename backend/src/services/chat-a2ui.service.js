import * as chatRepo from '../repositories/chat.repository.js';
import * as classRepo from '../repositories/class.repository.js';
import { executeTool } from '../chat/tools/executor.js';
import { findSurface, closeSurface } from '../chat/a2ui/surfaces.js';
import { ASSIGN_EXAM_ACTION } from '../chat/a2ui/assign-exam-form.js';
import { appendExchange } from './chat.service.js';
import { BadRequestError, NotFoundError } from '../utils/error.utils.js';

const MAX_MINUTES = 300;
const formatInputDateTime = (value) => (value ? value.replace('T', ' ') : null);

// Câu thay mặt giáo viên ghi vào lịch sử chat — để lượt sau model biết đã giao gì.
const describeAssignment = (className, minutes, openTime, deadline) =>
  `Giao bài: lớp ${className} · ${minutes} phút · ` +
  `${openTime ? `mở lúc ${formatInputDateTime(openTime)}` : 'mở ngay'} · ` +
  `${deadline ? `hạn nộp ${formatInputDateTime(deadline)}` : 'không giới hạn hạn nộp'}`;

const readAssignContext = (context) => {
  const classId = Number(Array.isArray(context.classId) ? context.classId[0] : context.classId);
  const minutes = Number(context.minutes);
  if (!Number.isInteger(classId) || classId <= 0) {
    throw new BadRequestError('Thầy/cô chọn lớp nhận bài giúp em nhé');
  }
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_MINUTES) {
    throw new BadRequestError(`Thời gian làm bài phải là số phút từ 1 đến ${MAX_MINUTES}`);
  }
  return { classId, minutes, openTime: context.openTime || '', deadline: context.deadline || '' };
};

// Form đã gửi xong → đánh dấu trong tin nhắn đã lưu để F5 xong form hiện ở trạng thái "đã giao".
const markSurfaceSubmitted = async (userId, surfaceId, summary) => {
  const row = await chatRepo.findAssistantMessageBySurface(userId, surfaceId);
  if (!row) return;
  const parts = JSON.parse(row.parts).map(p =>
    (p.type === 'data-a2ui' && p.data.surfaceId === surfaceId
      ? { ...p, data: { ...p.data, status: 'submitted', summary } } : p));
  await chatRepo.updateMessageParts(row.id, parts);
};

// Giáo viên bấm nút trên form A2UI (action v0.9: { name, surfaceId, context, ... }). Chạy thẳng
// tool tương ứng — không gọi model — với examId lấy từ form đã lưu ở server, không từ client.
export const handleA2uiAction = async ({ name, surfaceId, context = {}, sessionId }, user) => {
  const surface = findSurface(surfaceId, user.id);
  if (!surface) {
    throw new NotFoundError('Form đã hết hạn — thầy/cô nhờ chatbot mở lại form giúp em nhé');
  }
  if (surface.kind !== 'assign_exam' || name !== ASSIGN_EXAM_ACTION) {
    throw new BadRequestError('Thao tác không hợp lệ với form này');
  }

  const { classId, minutes, openTime, deadline } = readAssignContext(context);
  const result = await executeTool('assign_exam_to_class', {
    exam_id: surface.data.examId,
    class_id: classId,
    time_limit: minutes * 60,
    open_time: openTime || 'now',
    deadline: deadline || 'none',
  }, user);
  // Lỗi (hạn nộp ở quá khứ, đã giao rồi...) → báo lỗi, form vẫn mở để giáo viên sửa.
  if (!result.success) throw new BadRequestError(result.message);

  const className = (await classRepo.findById(classId))?.class_name ?? classId;
  const userText = describeAssignment(className, minutes, openTime, deadline);
  closeSurface(surfaceId);
  await markSurfaceSubmitted(user.id, surfaceId, userText);

  const messages = await appendExchange(user, sessionId, userText, result.message);
  console.log(`[chat] a2ui action userId=${user.id} name=${name} surface=${surfaceId}`);
  return { surfaceId, summary: userText, messages };
};
