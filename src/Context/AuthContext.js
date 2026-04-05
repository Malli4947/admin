import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthCtx = createContext(null);

// 🔒 Safe JSON parse
const safeParse = (data) => {
  try {
    return data && data !== "undefined" ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('pp_admin_token');
    const savedAdmin = localStorage.getItem('pp_admin_user');

    if (savedToken && savedAdmin) {
      const parsedUser = safeParse(savedAdmin);

      if (parsedUser) {
        setToken(savedToken);
        setAdmin(parsedUser);
      } else {
        // 🧹 clear corrupted data
        localStorage.removeItem('pp_admin_token');
        localStorage.removeItem('pp_admin_user');
      }
    }

    setLoading(false);
  }, []);

  const login = (tokenVal, user) => {
    localStorage.setItem('pp_admin_token', tokenVal);
    localStorage.setItem('pp_admin_user', JSON.stringify(user));
    setToken(tokenVal);
    setAdmin(user);
  };

  const logout = () => {
    localStorage.removeItem('pp_admin_token');
    localStorage.removeItem('pp_admin_user');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthCtx.Provider value={{ admin, token, loading, login, logout, isAuth: !!token }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);