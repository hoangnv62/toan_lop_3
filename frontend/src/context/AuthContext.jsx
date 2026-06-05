import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';
import { getToken } from '../api/index';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
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

export const useAuth = () => useContext(AuthContext);
