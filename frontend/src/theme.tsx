import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getInitial(): Theme {
  const saved = localStorage.getItem('mandarim_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light'; // padrão: modo claro
}

/** Controla o tema (claro/escuro), persiste em localStorage e aplica em <html>. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mandarim_theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return { theme, toggle };
}

/** Botão de alternância claro/escuro. */
export function ThemeToggle({ theme, toggle }: { theme: Theme; toggle: () => void }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      title={dark ? 'Modo claro' : 'Modo escuro'}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__thumb">{dark ? '🌙' : '☀️'}</span>
      </span>
    </button>
  );
}
