import * as relativeRepo from '../repositories/relative.repository.js';
import { NotFoundError, ForbiddenError, AppError } from '../utils/error.utils.js';
import { formatDate } from '../utils/date.utils.js';
import { Authority } from '../constants/authority.js';

const MAX_RELATIVES = 5;

const toRelative = (r) => ({
  id: r.id, name: r.name, phone: r.phone,
  email: r.email || null,
  relationship: r.relationship,
  created_at: formatDate(r.created_at),
});

// Học sinh chỉ xem được của chính mình; giáo viên chỉ xem được học sinh thuộc lớp mình dạy.
const canView = async (studentId, user) => {
  if (user.role === Authority.STUDENT) return studentId === user.id;
  if (user.role === Authority.TEACHER) return relativeRepo.isStudentOfTeacher(studentId, user.id);
  return false;
};

export const getRelatives = async (studentId, user) => {
  if (!(await canView(studentId, user))) throw new ForbiddenError('Không có quyền truy cập');
  const rels = await relativeRepo.findByStudent(studentId);
  return rels.map(toRelative);
};

export const addRelative = async (studentId, userId, name, phone, email, relationship) => {
  if (studentId !== userId) throw new ForbiddenError('Không có quyền truy cập');
  const count = await relativeRepo.countByStudent(studentId);
  if (count >= MAX_RELATIVES) throw new AppError(`Tối đa ${MAX_RELATIVES} người thân`, 400);
  const id = await relativeRepo.createRelative(studentId, name, phone, email, relationship);
  return toRelative(await relativeRepo.findById(id));
};

export const updateRelative = async (relativeId, studentId, name, phone, email, relationship) => {
  const rel = await relativeRepo.findById(relativeId);
  if (!rel) throw new NotFoundError('Không tìm thấy người thân');
  if (rel.student_id !== studentId) throw new ForbiddenError('Không có quyền truy cập');
  await relativeRepo.updateRelative(relativeId, name, phone, email, relationship);
  return toRelative(await relativeRepo.findById(relativeId));
};

export const deleteRelative = async (relativeId, studentId) => {
  const rel = await relativeRepo.findById(relativeId);
  if (!rel) throw new NotFoundError('Không tìm thấy người thân');
  if (rel.student_id !== studentId) throw new ForbiddenError('Không có quyền truy cập');
  await relativeRepo.deleteRelative(relativeId);
};
