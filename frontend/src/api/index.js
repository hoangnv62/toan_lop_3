import { API_BASE } from '../config';

export const getToken = () => localStorage.getItem('auth_token');
export const setToken = (t) => localStorage.setItem('auth_token', t);
export const clearToken = () => localStorage.removeItem('auth_token');

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = { ...options.headers };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await response.json();

  if (json.success === false) {
    const err = new Error(json.message || 'Request failed');
    err.status = response.status;
    err.data = json;
    throw err;
  }

  // Auto-unwrap: return json.data if present, otherwise return the full response
  return json.data !== undefined ? json.data : json;
}
