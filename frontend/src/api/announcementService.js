import api from './index';

export const getAnnouncements   = (classId)          => api.get(`/api/classes/${classId}/announcements`);
export const createAnnouncement = (classId, payload) => api.post(`/api/classes/${classId}/announcements`, payload);
export const deleteAnnouncement = (id)               => api.delete(`/api/announcements/${id}`);
