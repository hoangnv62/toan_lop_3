import api from './index';

export const getRelatives   = (studentId)        => api.get(`/api/students/${studentId}/relatives`);
export const addRelative    = (studentId, data)  => api.post(`/api/students/${studentId}/relatives`, data);
export const updateRelative = (relativeId, data) => api.put(`/api/relatives/${relativeId}`, data);
export const deleteRelative = (relativeId)       => api.delete(`/api/relatives/${relativeId}`);
