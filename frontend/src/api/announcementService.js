import { apiFetch } from './index';

export const getAnnouncements = (classId) => apiFetch(`/api/classes/${classId}/announcements`);
export const createAnnouncement = (classId, payload) => apiFetch(`/api/classes/${classId}/announcements`, { method: 'POST', body: JSON.stringify(payload) });
export const deleteAnnouncement = (id) => apiFetch(`/api/announcements/${id}`, { method: 'DELETE' });
