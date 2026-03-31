'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved pref or system pref
    const saved = localStorage.getItem('splitease-theme') as Theme | null;
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const initial: Theme = saved ?? system;

    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('splitease-theme', next);
  };

  // Prevent flash — children are hidden until we know the theme
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Drop-in toggle button */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn('theme-toggle', className)}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle colour theme"
    >
      {theme === 'dark' ? (
        <Sun size={16} strokeWidth={2.5} className="text-amber-300" />
      ) : (
        <Moon size={16} strokeWidth={2.5} className="text-slate-500" />
      )}
    </button>
  );
}