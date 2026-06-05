import axios from 'axios';
import { API_BASE } from '../config';

export const getToken   = () => localStorage.getItem('auth_token');
export const setToken   = (t) => localStorage.setItem('auth_token', t);
export const clearToken = () => localStorage.removeItem('auth_token');

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    const json = res.data;
    if (!json || typeof json !== 'object' || json instanceof Blob) return json;
    if (json.success === false) {
      const err = new Error(json.message || 'Request failed');
      err.status = res.status;
      err.data = json;
      throw err;
    }
    return json.data !== undefined ? json.data : json;
  },
  (error) => {
    const json = error.response?.data;
    const msg = (json && typeof json === 'object' && json.message) || error.message || 'Request failed';
    const err = new Error(msg);
    err.status = error.response?.status;
    err.data = json;
    throw err;
  }
);

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default api;
