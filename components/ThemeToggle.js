'use client';

import { useTheme } from '../lib/theme';

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Không render gì nếu chưa mounted để tránh hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className="material-icons">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
      <style jsx>{`
        .theme-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--acnh-green);
          color: white;
          border: none;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px var(--acnh-shadow);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
        }
        .theme-toggle:hover {
          background: var(--acnh-brown);
          transform: rotate(15deg) scale(1.1);
          box-shadow: 0 6px 16px var(--acnh-shadow);
        }
        .theme-toggle:active {
          transform: rotate(15deg) scale(0.95);
        }
        .material-icons {
          font-size: 24px;
          transition: transform 0.3s ease;
        }
        .theme-toggle:hover .material-icons {
          transform: scale(1.1);
        }
      `}</style>
    </button>
  );
}
