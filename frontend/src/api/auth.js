import api, { setToken, clearToken } from './index';

export const loginTeacher = async (username, password) => {
  const data = await api.post('/api/auth/login/teacher', { username, password });
  if (data.token) setToken(data.token);
  return data;
};

export const loginStudent = async (username, password) => {
  const data = await api.post('/api/auth/login/student', { username, password });
  if (data.token) setToken(data.token);
  return data;
};

export const registerTeacher = async (username, password, fullName) => {
  const data = await api.post('/api/auth/register/teacher', { username, password, fullName });
  if (data.token) setToken(data.token);
  return data;
};

export const registerStudent = async ({ username, password, fullName, dob }) => {
  const data = await api.post('/api/auth/register/student', { username, password, fullName, dob: dob || null });
  if (data.token) setToken(data.token);
  return data;
};

export const logout = () => { clearToken(); return Promise.resolve(); };

export const getMe = () => api.get('/api/auth/me');

export const changePassword = (currentPassword, newPassword) =>
  api.put('/api/auth/password', { currentPassword, newPassword });

export const getProfile = () => api.get('/api/auth/profile');

export const updateProfile = ({ fullName, dob, email, phone }) =>
  api.put('/api/auth/profile', { fullName, dob: dob || null, email: email || null, phone: phone || null });
