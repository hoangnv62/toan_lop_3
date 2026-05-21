import { apiFetch, setToken, clearToken } from './index';

export const loginTeacher = async (username, password) => {
  const data = await apiFetch('/api/auth/login/teacher', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (data.token) setToken(data.token);
  return data;
};

export const loginStudent = async (username, password) => {
  const data = await apiFetch('/api/auth/login/student', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (data.token) setToken(data.token);
  return data;
};

export const registerTeacher = async (username, password, fullName) => {
  const data = await apiFetch('/api/auth/register/teacher', {
    method: 'POST',
    body: JSON.stringify({ username, password, full_name: fullName }),
  });
  if (data.token) setToken(data.token);
  return data;
};

export const registerStudent = async ({ username, password, fullName, dob }) => {
  const data = await apiFetch('/api/auth/register/student', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      full_name: fullName,
      dob:       dob || null,
    }),
  });
  if (data.token) setToken(data.token);
  return data;
};

export const logout = () => { clearToken(); return Promise.resolve(); };

export const getMe = () => apiFetch('/api/auth/me');

export const changePassword = (currentPassword, newPassword) =>
  apiFetch('/api/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

export const updateProfile = (fullName) =>
  apiFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ fullName }) });
