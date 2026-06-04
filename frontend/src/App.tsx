import { useState } from 'react';
import { useAuth } from './auth';
import { useTheme, ThemeToggle } from './theme';
import { Login } from './pages/Login';
import { Flashcards } from './pages/Flashcards';
import { Exercise } from './pages/Exercise';
import { Dashboard } from './pages/Dashboard';

type Tab = 'flash' | 'exercise' | 'dash';

const TABS: { id: Tab; label: string }[] = [
  { id: 'flash', label: 'Flashcards' },
  { id: 'exercise', label: 'Exercício' },
  { id: 'dash', label: 'Painel' },
];

export function App() {
  const { user, ready, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>('flash');

  if (!ready) {
    return (
      <div className="login-wrap">
        <span className="seal pulse">學</span>
      </div>
    );
  }

  if (!user) return <Login theme={theme} toggle={toggle} />;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="seal">學</span>
          <div>
            <div className="name">Manda<em>Rim</em></div>
            <div className="sub">学习 · aprenda mandarim</div>
          </div>
        </div>

        <nav className="nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="userbox">
          <ThemeToggle theme={theme} toggle={toggle} />
          <div className="who">
            <b>{user.name}</b>
            <small>
              HSK {user.hskLevel} · <span className="streak">🔥 {user.streak ?? 0}</span>
            </small>
          </div>
          <button className="btn ghost small" onClick={logout}>Sair</button>
        </div>
      </header>

      <main>
        {tab === 'flash' && <Flashcards />}
        {tab === 'exercise' && <Exercise />}
        {tab === 'dash' && <Dashboard />}
      </main>
    </div>
  );
}
