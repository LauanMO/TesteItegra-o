import { useState } from 'react';
import { useAuth } from '../auth';
import { ThemeToggle } from '../theme';
import './Login.css';

export function Login({ theme, toggle }: { theme: 'light' | 'dark'; toggle: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="ghost-hanzi">学</div>
      <div className="login-topbar">
        <ThemeToggle theme={theme} toggle={toggle} />
      </div>
      <div className="login-card panel rise">
        <div className="brand" style={{ marginBottom: 18 }}>
          <span className="seal">學</span>
          <div className="name" style={{ fontSize: 28 }}>
            Manda<em style={{ color: 'var(--accent)', fontStyle: 'normal' }}>Rim</em>
          </div>
        </div>
        <h1 style={{ fontSize: 34 }}>{isRegister ? 'Criar conta' : 'Bem-vindo de volta'}</h1>
        <p className="lede">
          {isRegister
            ? 'Comece sua jornada pelo HSK 1 — 150 palavras essenciais.'
            : 'Entre para continuar de onde parou.'}
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit}>
          {isRegister && (
            <div className="field">
              <label>Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
            </div>
          )}
          <div className="field">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
            />
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              required
            />
          </div>
          <button className="btn" type="submit" disabled={busy} style={{ width: '100%', marginTop: 6 }}>
            {busy ? '...' : isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <p className="switch">
          {isRegister ? 'Já tem conta? ' : 'Ainda não tem conta? '}
          <button
            onClick={() => {
              setError('');
              setMode(isRegister ? 'login' : 'register');
            }}
          >
            {isRegister ? 'Entrar' : 'Cadastre-se'}
          </button>
        </p>
      </div>
    </div>
  );
}
