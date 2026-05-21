import { apiFetch, getToken } from './index';
import { API_BASE } from '../config';

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

export const getClassExams   = (classId)                   => apiFetch(`/api/classes/${classId}/exams`);
export const assignExam      = (classId, examId, deadline, openTime) =>
  apiFetch(`/api/classes/${classId}/exams`, {
    method: 'POST',
    body: JSON.stringify({ exam_id: examId, deadline: deadline || null, open_time: openTime || null }),
  });
export const unassignExam    = (classId, examId)           =>
  apiFetch(`/api/classes/${classId}/exams/${examId}`, { method: 'DELETE' });

export async function exportStudents(classId, className) {
  const response = await fetch(`${API_BASE}/api/classes/${classId}/students/export`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error('Export thất bại');
  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${className}-hocsinh.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
