import api from './index';

export const fetchDashboard = (dateFrom, dateTo, all = false) =>
  all
    ? api.get('/api/dashboard/student?all=true')
    : api.get(`/api/dashboard/student?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`);

export const fetchTeacherDashboard = () => api.get('/api/dashboard/teacher');

export const getAIAdvice = (payload) => api.post('/api/dashboard/advice', payload);

export const getStudentResults  = (studentId) => api.get(`/api/students/${studentId}/results`);
export const getStudentProgress = (studentId) => api.get(`/api/students/${studentId}/progress`);
