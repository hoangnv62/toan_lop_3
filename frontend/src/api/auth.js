import { apiFetch, setToken, clearToken } from './index';

export const checkPhone = (phone) =>
  apiFetch('/api/auth/check-phone', { method: 'POST', body: JSON.stringify({ phone }) });

export const loginStudent = async (phone, password) => {
  const data = await apiFetch('/api/auth/login/student', { method: 'POST', body: JSON.stringify({ phone, password }) });
  if (data.token) setToken(data.token);
  return data;
};

export const loginTeacher = async (username, password) => {
  const data = await apiFetch('/api/auth/login/teacher', { method: 'POST', body: JSON.stringify({ username, password }) });
  if (data.token) setToken(data.token);
  return data;
};

export const logout = () => { clearToken(); return Promise.resolve(); };

export const getMe = () => apiFetch('/api/auth/me');
