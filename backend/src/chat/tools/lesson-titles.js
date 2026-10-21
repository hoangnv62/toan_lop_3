import { z } from 'zod';
import * as lessonService from '../../services/lesson.service.js';

const MAX_LESSONS = 200;

// Tên bài học model gửi lên: bỏ khoảng trắng thừa trước khi lưu ("Phép  nhân " → "Phép nhân").
export const lessonTitleSchema = z.string().trim()
  .min(1, 'Tên bài học không được trống')
  .max(255, 'Tên bài học tối đa 255 ký tự')
  .transform(title => title.replace(/\s+/g, ' '));

// So tên bài học bỏ qua hoa/thường và khoảng trắng thừa: "Phép  nhân" = "phép nhân".
export const normalizeTitle = (title) => title.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');

export const teacherLessons = async (teacherId) =>
  (await lessonService.getLessons(teacherId, '', 1, MAX_LESSONS)).items;

// Bài có tên chứa tên kia (vd. "Phép nhân" và "Phép nhân trong phạm vi 100") — dễ là cùng một
// bài, tạo thêm thì giáo viên có 2 bài gần trùng và câu hỏi bị chia ra 2 nơi.
export const findSimilarLessons = (lessons, title) => {
  const wanted = normalizeTitle(title);
  return lessons.filter(l => {
    const existing = normalizeTitle(l.title);
    return existing !== wanted && (existing.includes(wanted) || wanted.includes(existing));
  });
};
