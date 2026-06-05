import api from './index';

export const generateQuestions = (payload) => api.post('/api/questions/generate', payload);

export async function importQuestionsFromExcel(file) {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/questions/import-excel', form);
}
