import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  // We don't need to hold state here as the component will read from localStorage
  // This hook is now just an initializer and a provider of the setter function.
  
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = storedTheme || 'system';
    applyTheme(initialTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        // Only apply if the theme is set to 'system'
        if (localStorage.getItem('theme') === 'system') {
            applyTheme('system');
        }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (selectedTheme: Theme) => {
    const root = window.document.documentElement;
    const isDark =
      selectedTheme === 'dark' ||
      (selectedTheme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
    
    // Update meta theme-color for mobile browser chrome
    const themeColor = isDark ? '#020817' : '#ffffff';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
  };

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    // Dispatch a storage event to sync theme across tabs
    window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: newTheme }));
  };
  
  // A helper function to get the current theme for the UI component
  const getCurrentTheme = (): Theme => {
      return (localStorage.getItem('theme') as Theme | null) || 'system';
  };

  return { setTheme, getCurrentTheme };
}
