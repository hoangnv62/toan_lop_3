import { apiFetch, getToken } from './index';
import { API_BASE } from '../config';

export const getQuestionBank = (page = 1, limit = 10, q = '', lessonId = null) => {
  const params = new URLSearchParams({ page, limit });
  if (q) params.set('q', q);
  if (lessonId !== null) params.set('lesson_id', lessonId);
  return apiFetch(`/api/question-bank?${params}`);
};
export const createBankQuestion = (payload) => apiFetch('/api/question-bank', { method: 'POST', body: JSON.stringify(payload) });
export const updateBankQuestion = (id, payload) => apiFetch(`/api/question-bank/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteBankQuestion = (id) => apiFetch(`/api/question-bank/${id}`, { method: 'DELETE' });

export const importQuestionBankFromExcel = (file, lessonId = null) => {
  const form = new FormData();
  form.append('file', file);
  if (lessonId !== null) form.append('lesson_id', lessonId);
  return apiFetch('/api/question-bank/import-excel', { method: 'POST', body: form });
};

export async function downloadSampleQuestionBank() {
  const res = await fetch(`${API_BASE}/api/question-bank/sample-excel`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Tải file mẫu thất bại');
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'mau_ngan_hang_cau_hoi.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
