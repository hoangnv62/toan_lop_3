import { apiFetch } from './index';

export const fetchExam = (id) => apiFetch(`/api/exams/${id}`);
export const deleteExam = (id) => apiFetch(`/api/exams/${id}`, { method: 'DELETE' });
export const saveExam = (lessonId, examId, payload) => {
  const url = examId ? `/api/lessons/${lessonId}/exams/${examId}` : `/api/lessons/${lessonId}/exams`;
  return apiFetch(url, { method: examId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
};
export const submitExam = (examId, payload) =>
  apiFetch(`/api/exams/${examId}/submit`, { method: 'POST', body: JSON.stringify(payload) });
export const getExamResult = (examId) => apiFetch(`/api/exams/${examId}/result`);
export const getExamStats = (examId) => apiFetch(`/api/exams/${examId}/stats`);
