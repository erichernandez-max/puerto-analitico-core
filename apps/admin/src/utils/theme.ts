/**
 * Sincroniza automáticamente la clase 'dark' con el esquema de color del sistema operativo (móvil/desktop).
 */
export function initThemeListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const applyTheme = (isDark: boolean) => {
    const root = document.documentElement;
    const appContainer = document.getElementById('puerto-admin-root') || document.getElementById('root');

    if (isDark) {
      root.classList.add('dark');
      appContainer?.classList.add('dark');
    } else {
      root.classList.remove('dark');
      appContainer?.classList.remove('dark');
    }
  };

  applyTheme(mediaQuery.matches);

  const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  } else {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }
}
