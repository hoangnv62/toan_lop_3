import { apiFetch } from './index';

export const fetchClasses    = ()              => apiFetch('/api/classes');
export const createClass     = (class_name)    => apiFetch('/api/classes', { method: 'POST', body: JSON.stringify({ class_name }) });
export const deleteClass     = (id)            => apiFetch(`/api/classes/${id}`, { method: 'DELETE' });
export const updateClass     = (id, className) => apiFetch(`/api/classes/${id}`, { method: 'PUT', body: JSON.stringify({ className }) });
export const getClassDetail  = (id)            => apiFetch(`/api/classes/${id}`);

export const searchStudents  = (q, classId)    =>
  apiFetch(`/api/students/search?q=${encodeURIComponent(q)}&class_id=${classId}`);

export const assignStudent   = (classId, username) =>
  apiFetch(`/api/classes/${classId}/students`, { method: 'POST', body: JSON.stringify({ username }) });

export const removeStudent   = (classId, studentId) =>
  apiFetch(`/api/classes/${classId}/students/${studentId}`, { method: 'DELETE' });

export const uploadStudents  = (classId, file) => {
  const form = new FormData();
  form.append('file', file);
  return apiFetch(`/api/classes/${classId}/students/upload`, { method: 'POST', body: form });
};
