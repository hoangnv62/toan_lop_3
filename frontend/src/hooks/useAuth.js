import { useState } from 'react';
import { login as loginApi, register as registerApi, changePassword as changePasswordApi, updateProfile as updateProfileApi } from '../api/auth';
import { clearToken } from '../api/index';
import { toastPromise } from '../utils/toast-promise';
import { useAuth } from '../context/auth-context';

export const useAuthMutations = () => {
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const login = async (username, password) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        loginApi(username, password),
        {
          loading: 'Đang đăng nhập...',
          success: 'Đăng nhập thành công',
          error: (err) => err?.message || 'Sai tài khoản hoặc mật khẩu',
        }
      );
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const register = async (payload, role, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        registerApi(payload, role),
        {
          loading: 'Đang đăng ký...',
          success: 'Đăng ký thành công',
          error: (err) => err?.message || 'Đăng ký thất bại',
        }
      );
      setUser(data.user);
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        changePasswordApi(currentPassword, newPassword),
        {
          loading: 'Đang đổi mật khẩu...',
          success: 'Đổi mật khẩu thành công',
          error: (err) => err?.message || 'Đổi mật khẩu thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        updateProfileApi(payload),
        {
          loading: 'Đang cập nhật hồ sơ...',
          success: 'Cập nhật hồ sơ thành công',
          error: (err) => err?.message || 'Cập nhật hồ sơ thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { login, logout, register, changePassword, updateProfile, loading };
};
