// src/contexts/ThemeContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Always default to dark. Only apply light if user explicitly chose it THIS session.
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedMotion = localStorage.getItem('reducedMotion') === 'true';

    // Force dark unless explicitly set to light
    const effectiveTheme = savedTheme === 'light' ? 'light' : 'dark';
    setTheme(effectiveTheme);
    setReducedMotion(savedMotion);

    // Apply theme class
    document.documentElement.classList.toggle('light', effectiveTheme === 'light');
    // Always ensure dark class present for Tailwind dark: variants
    document.documentElement.classList.add('dark');

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) setReducedMotion(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
    document.documentElement.classList.add('dark');
  };

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    localStorage.setItem('reducedMotion', String(newValue));
  };

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    // Allows components to set explicit theme: 'light' | 'dark' | 'system'
    setTheme: (newTheme) => {
      try {
        if (!newTheme) return;
        // Persist choice
        localStorage.setItem('theme', newTheme);
        setTheme(newTheme);

        // Determine effective theme when using 'system'
        let effective = newTheme;
        if (newTheme === 'system') {
          const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
          effective = prefersLight ? 'light' : 'dark';
        }

        document.documentElement.classList.toggle('light', effective === 'light');
      } catch (err) {
        console.error('Failed to set theme:', err);
      }
    },
    reducedMotion,
    toggleReducedMotion,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;