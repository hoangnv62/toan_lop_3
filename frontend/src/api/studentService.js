import { apiFetch } from './index';

export const fetchDashboard = (dateFrom, dateTo, all = false) =>
  all
    ? apiFetch('/api/dashboard/student?all=true')
    : apiFetch(`/api/dashboard/student?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`);

export const fetchTeacherDashboard = () => apiFetch('/api/dashboard/teacher');

export const getAIAdvice = (payload) =>
  apiFetch('/api/dashboard/advice', { method: 'POST', body: JSON.stringify(payload) });

export const getStudentResults = (studentId) => apiFetch(`/api/students/${studentId}/results`);

export const getStudentProgress = (studentId) => apiFetch(`/api/students/${studentId}/progress`);
