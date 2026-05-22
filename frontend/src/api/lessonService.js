import { apiFetch } from './index';

export const fetchLessons = (q = '', page = 1, limit = 10) => {
  const params = new URLSearchParams({ page, limit });
  if (q) params.set('q', q);
  return apiFetch(`/api/lessons?${params}`);
};
export const fetchLesson = (id) => apiFetch(`/api/lessons/${id}`);
export const createLesson = (title) => apiFetch('/api/lessons', { method: 'POST', body: JSON.stringify({ title }) });
export const updateLesson = (id, title) => apiFetch(`/api/lessons/${id}`, { method: 'PUT', body: JSON.stringify({ title }) });
export const deleteLesson = (id) => apiFetch(`/api/lessons/${id}`, { method: 'DELETE' });
