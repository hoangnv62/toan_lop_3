import api, { downloadBlob } from './index';

export const fetchClasses    = (page = 1, limit = 12) => api.get(`/api/classes?page=${page}&limit=${limit}`);
export const createClass     = (className)             => api.post('/api/classes', { className });
export const deleteClass     = (id)                    => api.delete(`/api/classes/${id}`);
export const updateClass     = (id, className)         => api.put(`/api/classes/${id}`, { className });
export const getClassDetail  = (id, studentPage = 1)   => api.get(`/api/classes/${id}?studentPage=${studentPage}`);

export const searchStudents  = (q, classId) =>
  api.get(`/api/students/search?q=${encodeURIComponent(q)}&classId=${classId}`);

export const assignStudent   = (classId, username) =>
  api.post(`/api/classes/${classId}/students`, { username });

export const removeStudent   = (classId, studentId) =>
  api.delete(`/api/classes/${classId}/students/${studentId}`);

export const uploadStudents  = (classId, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/api/classes/${classId}/students/upload`, form);
};

export const getClassExams   = (classId) => api.get(`/api/classes/${classId}/exams`);

export const assignExam = (classId, examId, timeLimitMin, deadline, openTime) =>
  api.post(`/api/classes/${classId}/exams`, {
    examId,
    timeLimit: Number(timeLimitMin) * 60,
    deadline,
    openTime,
  });

export const updateExamAssignment = (classId, examId, timeLimitMin, deadline, openTime) =>
  api.put(`/api/classes/${classId}/exams/${examId}`, {
    timeLimit: Number(timeLimitMin) * 60,
    deadline,
    openTime,
  });

export const unassignExam = (classId, examId) =>
  api.delete(`/api/classes/${classId}/exams/${examId}`);

export async function downloadSampleStudentsExcel() {
  const blob = await api.get('/api/classes/students/sample-excel', { responseType: 'blob' });
  downloadBlob(blob, 'mau_import_hocsinh.xlsx');
}

export async function exportStudents(classId, className) {
  const blob = await api.get(`/api/classes/${classId}/students/export`, { responseType: 'blob' });
  downloadBlob(blob, `${className}-hocsinh.xlsx`);
}
