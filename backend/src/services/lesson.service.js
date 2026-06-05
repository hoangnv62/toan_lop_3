import * as lessonRepo from '../repositories/lesson.repository.js';
import { NotFoundError } from '../utils/error.utils.js';
import { formatDate } from '../utils/date.utils.js';

export const getLessons = async (teacherId, q = '', page = 1, limit = 10) => {
  const result = await lessonRepo.findByTeacher(teacherId, q, page, limit);
  result.items = result.items.map(r => ({
    ...r,
    created_at: formatDate(r.created_at),
  }));
  return result;
};

export const getLesson = async (lessonId) => {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson) throw new NotFoundError('Bài học không tồn tại');
  const exams = await lessonRepo.findExamsByLesson(lessonId);
  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    description: lesson.description || '',
    exams: exams.map(e => ({
      id: e.id, name: e.name, description: e.description,
      date_created: formatDate(e.date_created),
    })),
  };
};

export const createLesson = async (teacherId, title) => {
  await lessonRepo.createLesson(teacherId, title);
};

export const updateLesson = async (lessonId, teacherId, title) => {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson || lesson.teacher_id !== teacherId) throw new NotFoundError('Bài học không tồn tại');
  await lessonRepo.updateLesson(lessonId, title);
};

export const deleteLesson = async (lessonId, teacherId) => {
  const lesson = await lessonRepo.findById(lessonId);
  if (!lesson || lesson.teacher_id !== teacherId) throw new NotFoundError('Bài học không tồn tại');
  await lessonRepo.deleteLesson(lessonId);
};
