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
// DELETE có body: axios cần truyền qua `data`, không phải tham số thứ 2 như post/put.
export const deleteBankQuestions = (ids) => api.delete('/api/question-bank', { data: { ids } });

// Tạo câu hỏi bằng AI — chỉ trả về, chưa lưu. Chậm (tới ~2 phút cho 50 câu) nên
// axios phải để timeout mặc định là 0 (không giới hạn).
export const generateBankQuestions = (payload) => api.post('/api/question-bank/generate', payload);
export const saveBankQuestionsBatch = (payload) => api.post('/api/question-bank/batch', payload);

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
