import { randomUUID } from 'crypto';

// Form A2UI chatbot đã gửi cho giáo viên. Dữ liệu nhạy cảm (đề nào, của ai) nằm ở ĐÂY, không
// lấy từ `context` client gửi lên — client chỉ gửi phần giáo viên tự điền (lớp, thời gian...).
//
// Lưu trong bộ nhớ tiến trình như confirmation.js: khởi động lại backend thì form cũ hết hạn,
// giáo viên nhờ chatbot mở lại là xong.
const SURFACE_TTL_MS = 30 * 60 * 1000;
const surfaces = new Map(); // surfaceId → { userId, kind, data, createdAt }

const isFresh = (surface) => Date.now() - surface.createdAt < SURFACE_TTL_MS;

export const registerSurface = ({ userId, kind, data }) => {
  for (const [id, surface] of surfaces) if (!isFresh(surface)) surfaces.delete(id);
  const surfaceId = `${kind}_${randomUUID()}`;
  surfaces.set(surfaceId, { userId, kind, data, createdAt: Date.now() });
  return surfaceId;
};

// null khi không có, hết hạn, hoặc là form của người khác.
export const findSurface = (surfaceId, userId) => {
  const surface = surfaces.get(surfaceId);
  return surface && surface.userId === userId && isFresh(surface) ? surface : null;
};

export const closeSurface = (surfaceId) => surfaces.delete(surfaceId);
