import { apiFetch } from './index';

export const getRelatives   = (studentId) =>
  apiFetch(`/api/students/${studentId}/relatives`);

export const addRelative    = (studentId, data) =>
  apiFetch(`/api/students/${studentId}/relatives`, { method: 'POST', body: JSON.stringify(data) });

export const updateRelative = (relativeId, data) =>
  apiFetch(`/api/relatives/${relativeId}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteRelative = (relativeId) =>
  apiFetch(`/api/relatives/${relativeId}`, { method: 'DELETE' });
