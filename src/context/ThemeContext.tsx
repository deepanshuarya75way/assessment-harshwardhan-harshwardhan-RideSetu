'use client';

import React, { createContext, useContext, useEffect } from 'react';

type ThemeMode = 'light';

interface ThemeContextType {
  theme: 'light';
  setTheme: (mode: any) => void;
  resolvedTheme: 'light';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  resolvedTheme: 'light',
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Force light mode globally
    const root = document.documentElement;
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    try {
      localStorage.setItem('ridesetu_theme', 'light');
      localStorage.setItem('ridesetu-theme', 'light');
    } catch {
      // ignore storage errors
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme: () => {}, resolvedTheme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
