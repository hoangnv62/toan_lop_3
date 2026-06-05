import * as relativeRepo from '../repositories/relative.repository.js';
import { NotFoundError, ForbiddenError, AppError } from '../utils/error.utils.js';
import { formatDate } from '../utils/date.utils.js';

const MAX_RELATIVES = 5;

export const getRelatives = async (studentId) => {
  const rels = await relativeRepo.findByStudent(studentId);
  return rels.map(r => ({
    id: r.id, name: r.name, phone: r.phone,
    relationship: r.relationship,
    created_at: formatDate(r.created_at),
  }));
};

export const addRelative = async (studentId, name, phone, relationship) => {
  const count = await relativeRepo.countByStudent(studentId);
  if (count >= MAX_RELATIVES) throw new AppError(`Tối đa ${MAX_RELATIVES} người thân`, 400);
  return relativeRepo.createRelative(studentId, name, phone, relationship);
};

export const updateRelative = async (relativeId, studentId, name, phone, relationship) => {
  const rel = await relativeRepo.findById(relativeId);
  if (!rel) throw new NotFoundError('Không tìm thấy người thân');
  if (rel.student_id !== studentId) throw new ForbiddenError('Không có quyền truy cập');
  await relativeRepo.updateRelative(relativeId, name, phone, relationship);
};

export const deleteRelative = async (relativeId, studentId) => {
  const rel = await relativeRepo.findById(relativeId);
  if (!rel) throw new NotFoundError('Không tìm thấy người thân');
  if (rel.student_id !== studentId) throw new ForbiddenError('Không có quyền truy cập');
  await relativeRepo.deleteRelative(relativeId);
};
