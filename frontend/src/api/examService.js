import api, { downloadBlob } from './index';

export const fetchExam = (id) => api.get(`/api/exams/${id}`);
export const deleteExam = (id) => api.delete(`/api/exams/${id}`);
export const saveExam = (lessonId, examId, payload) => {
  const url = examId ? `/api/lessons/${lessonId}/exams/${examId}` : `/api/lessons/${lessonId}/exams`;
  return examId ? api.put(url, payload) : api.post(url, payload);
};
export const submitExam          = (examId, payload)          => api.post(`/api/exams/${examId}/submit`, payload);
export const getExamResult       = (examId)                   => api.get(`/api/exams/${examId}/result`);
export const getExamStats        = (examId)                   => api.get(`/api/exams/${examId}/stats`);
export const getClassResults     = (examId)                   => api.get(`/api/exams/${examId}/class-results`);
export const getAiExamFeedback   = (examId)                   => api.post(`/api/exams/${examId}/ai-feedback`);
export const getAiStatsAnalysis  = (examId)                   => api.post(`/api/exams/${examId}/ai-analysis`);
export const getStudentSubmission = (examId, studentId)       => api.get(`/api/exams/${examId}/submissions/${studentId}`);
export const getExamAssignments  = (examId)                   => api.get(`/api/exams/${examId}/assignments`);
export const cloneExam           = (examId)                   => api.post(`/api/exams/${examId}/clone`);
export const saveComment         = (examId, studentId, comment) =>
  api.post(`/api/exams/${examId}/submissions/${studentId}/comment`, { comment });

export async function exportExamPdf(examId, { variants = 1, duration = 45 } = {}) {
  const blob = await api.get(
    `/api/exams/${examId}/export-pdf?variants=${variants}&duration=${duration}`,
    { responseType: 'blob' }
  );
  downloadBlob(blob, `de-thi-${examId}.pdf`);
}

export async function exportExam(examId, filename) {
  const blob = await api.get(`/api/exams/${examId}/export`, { responseType: 'blob' });
  downloadBlob(blob, filename || `ket-qua-${examId}.xlsx`);
}
