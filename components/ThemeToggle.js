'use client';

import { useTheme } from '../lib/theme';

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={theme === 'light' ? 'Switch to night' : 'Switch to day'}
      title={theme === 'light' ? 'Switch to night' : 'Switch to day'}
    >
      <span className="material-icons">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
}
