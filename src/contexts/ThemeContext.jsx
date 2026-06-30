/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'erdinc-bayer-akademi-theme';

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function startThemeTransitionLock() {
  document.documentElement.classList.add('theme-transitioning');
  window.dispatchEvent(new Event('theme-transition-start'));
}

function endThemeTransitionLock() {
  document.documentElement.classList.remove('theme-transitioning');
  window.dispatchEvent(new Event('theme-transition-end'));
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('edutr-theme') || 'light');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setThemeWithDocument = useCallback((nextTheme) => {
    const resolvedTheme = typeof nextTheme === 'function' ? nextTheme(theme) : nextTheme;
    applyTheme(resolvedTheme);
    setTheme(resolvedTheme);
  }, [theme]);

  const toggleTheme = useCallback((origin) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const x = origin?.x ?? window.innerWidth - 32;
    const y = origin?.y ?? 32;

    function commitThemeChange() {
      applyTheme(nextTheme);
      flushSync(() => setTheme(nextTheme));
    }

    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commitThemeChange();
      return;
    }

    startThemeTransitionLock();
    const transition = document.startViewTransition(commitThemeChange);
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 460,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    }).catch(() => {});

    transition.finished.finally(endThemeTransitionLock);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme: setThemeWithDocument,
    }),
    [setThemeWithDocument, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme ThemeProvider içinde kullanılmalıdır.');
  return context;
}
