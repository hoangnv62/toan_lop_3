import api from './index';

export const fetchLessons = (q = '', page = 1, limit = 10) => {
  const params = new URLSearchParams({ page, limit });
  if (q) params.set('q', q);
  return api.get(`/api/lessons?${params}`);
};
export const fetchLesson  = (id)            => api.get(`/api/lessons/${id}`);
export const createLesson = (title)         => api.post('/api/lessons', { title });
export const updateLesson = (id, title)     => api.put(`/api/lessons/${id}`, { title });
export const deleteLesson = (id)            => api.delete(`/api/lessons/${id}`);
