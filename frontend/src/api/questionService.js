import { apiFetch, getToken } from './index';
import { API_BASE } from '../config';

export const generateQuestions = (payload) =>
  apiFetch('/api/questions/generate', { method: 'POST', body: JSON.stringify(payload) });

export async function importQuestionsFromExcel(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/questions/import-excel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Import thất bại');
  return json;
}
