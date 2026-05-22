import { apiFetch } from './index';

export const getQuestionBank = (page = 1, limit = 10) => apiFetch(`/api/question-bank?page=${page}&limit=${limit}`);
export const createBankQuestion = (payload) => apiFetch('/api/question-bank', { method: 'POST', body: JSON.stringify(payload) });
export const updateBankQuestion = (id, payload) => apiFetch(`/api/question-bank/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteBankQuestion = (id) => apiFetch(`/api/question-bank/${id}`, { method: 'DELETE' });
