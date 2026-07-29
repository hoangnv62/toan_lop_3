import { createContext, useContext } from 'react';

// Tách khỏi AuthContext.jsx để file đó chỉ export component — điều kiện để
// Vite giữ được Fast Refresh (rule react-refresh/only-export-components).
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
