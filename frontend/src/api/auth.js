import api, { setToken, clearToken } from './index';

export const login = async (username, password, role) => {
  const data = await api.post(`/api/auth/login/${role}`, { username, password });
  if (data.token) setToken(data.token);
  return data;
};

export const register = async ({ username, password, fullName, dob }, role) => {
  const data = await api.post(`/api/auth/register/${role}`, { username, password, fullName, dob: dob || null });
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
