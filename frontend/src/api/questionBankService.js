import api, { downloadBlob } from './index';

export const getQuestionBank = (page = 1, limit = 10, q = '', lessonId = null) => {
  const params = new URLSearchParams({ page, limit });
  if (q) params.set('q', q);
  if (lessonId !== null) params.set('lessonId', lessonId);
  return api.get(`/api/question-bank?${params}`);
};
export const createBankQuestion = (payload) => api.post('/api/question-bank', payload);
export const updateBankQuestion = (id, payload) => api.put(`/api/question-bank/${id}`, payload);
export const deleteBankQuestion = (id) => api.delete(`/api/question-bank/${id}`);

export const importQuestionBankFromExcel = (file, lessonId = null) => {
  const form = new FormData();
  form.append('file', file);
  if (lessonId !== null) form.append('lessonId', lessonId);
  return api.post('/api/question-bank/import-excel', form);
};

export async function downloadSampleQuestionBank() {
  const blob = await api.get('/api/question-bank/sample-excel', { responseType: 'blob' });
  downloadBlob(blob, 'mau_ngan_hang_cau_hoi.xlsx');
}
