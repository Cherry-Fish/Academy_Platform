import { useEffect, useState } from 'react';

function applyTheme(dark) {
  if (dark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('academy_theme');
    const dark = saved === 'dark';
    applyTheme(dark);
    return dark;
  });

  useEffect(() => {
    applyTheme(isDarkMode);
    localStorage.setItem('academy_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return { isDarkMode, toggleDarkMode };
}
