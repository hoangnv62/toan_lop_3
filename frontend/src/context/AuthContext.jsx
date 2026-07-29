import { useState, useEffect } from 'react';
import { getMe } from '../api/auth';
import { getToken } from '../api/index';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Chỉ chờ khi thực sự có token để khôi phục phiên — không có token thì
  // vào thẳng trang đăng nhập, khỏi setLoading(false) đồng bộ trong effect.
  const [loading, setLoading] = useState(() => !!getToken());

  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then(data => { if (data.loggedIn) setUser(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
