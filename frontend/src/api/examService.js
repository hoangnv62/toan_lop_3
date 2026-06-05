import { apiFetch, getToken } from './index';
import { API_BASE } from '../config';

export const fetchExam = (id) => apiFetch(`/api/exams/${id}`);
export const deleteExam = (id) => apiFetch(`/api/exams/${id}`, { method: 'DELETE' });
export const saveExam = (lessonId, examId, payload) => {
  const url = examId ? `/api/lessons/${lessonId}/exams/${examId}` : `/api/lessons/${lessonId}/exams`;
  return apiFetch(url, { method: examId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
};
export const submitExam = (examId, payload) =>
  apiFetch(`/api/exams/${examId}/submit`, { method: 'POST', body: JSON.stringify(payload) });
export const getExamResult = (examId) => apiFetch(`/api/exams/${examId}/result`);
export const getExamStats       = (examId) => apiFetch(`/api/exams/${examId}/stats`);
export const getClassResults    = (examId) => apiFetch(`/api/exams/${examId}/class-results`);
export const getAiExamFeedback  = (examId) => apiFetch(`/api/exams/${examId}/ai-feedback`, { method: 'POST' });
export const getAiStatsAnalysis = (examId) => apiFetch(`/api/exams/${examId}/ai-analysis`, { method: 'POST' });
export const getStudentSubmission  = (examId, studentId) =>
  apiFetch(`/api/exams/${examId}/submissions/${studentId}`);
export const getExamAssignments = (examId) =>
  apiFetch(`/api/exams/${examId}/assignments`);

export const cloneExam = (examId) =>
  apiFetch(`/api/exams/${examId}/clone`, { method: 'POST' });

export const saveComment = (examId, studentId, comment) =>
  apiFetch(`/api/exams/${examId}/submissions/${studentId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });

export async function exportExamPdf(examId, { variants = 1, duration = 45 } = {}) {
  const response = await fetch(
    `${API_BASE}/api/exams/${examId}/export-pdf?variants=${variants}&duration=${duration}`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  if (!response.ok) throw new Error('Tạo PDF thất bại');
  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `de-thi-${examId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportExam(examId, filename) {
  const response = await fetch(`${API_BASE}/api/exams/${examId}/export`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error('Export thất bại');
  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename || `ket-qua-${examId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
