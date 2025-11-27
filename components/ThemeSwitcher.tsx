import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from './Icons';

export const ThemeSwitcher: React.FC = () => {
  const { setTheme, getCurrentTheme } = useTheme();
  const [activeTheme, setActiveTheme] = useState(getCurrentTheme);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme') {
        setActiveTheme(event.newValue as any || 'system');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const handleSetTheme = (theme: 'light' | 'dark' | 'system') => {
      setTheme(theme);
      setActiveTheme(theme);
  }

  const options = [
    { name: 'Light', value: 'light', icon: SunIcon },
    { name: 'Dark', value: 'dark', icon: MoonIcon },
    { name: 'System', value: 'system', icon: ComputerDesktopIcon },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">Theme</h3>
      <p className="text-sm text-muted-foreground mb-6">Choose how the application looks. System will match your OS settings.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = activeTheme === option.value;
          return (
            <button
              key={option.value}
              onClick={() => handleSetTheme(option.value as any)}
              className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 transition-all duration-200 ${
                isActive
                  ? 'border-primary bg-primary/20 shadow-lg'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <Icon className={`w-7 h-7 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-semibold text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {option.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
