import React, { createContext, useContext, useState, useEffect } from 'react';
const ThemeCtx = createContext(null);
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('pp_admin_theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pp_admin_theme', theme);
  }, [theme]);
  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  return <ThemeCtx.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);