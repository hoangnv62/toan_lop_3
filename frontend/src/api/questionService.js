import { apiFetch } from './index';

export const generateQuestions = (payload) =>
  apiFetch('/api/questions/generate', { method: 'POST', body: JSON.stringify(payload) });
