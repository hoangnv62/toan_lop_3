import { apiFetch } from './index';

export const fetchLessons = (q = '') =>
  apiFetch(q ? `/api/lessons?q=${encodeURIComponent(q)}` : '/api/lessons');
export const fetchLesson = (id) => apiFetch(`/api/lessons/${id}`);
export const createLesson = (title) => apiFetch('/api/lessons', { method: 'POST', body: JSON.stringify({ title }) });
export const updateLesson = (id, title) => apiFetch(`/api/lessons/${id}`, { method: 'PUT', body: JSON.stringify({ title }) });
export const deleteLesson = (id) => apiFetch(`/api/lessons/${id}`, { method: 'DELETE' });
