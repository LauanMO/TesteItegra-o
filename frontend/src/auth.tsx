import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setToken, getToken } from './api';
import type { User } from './types';

interface AuthValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthValue>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  async function refresh() {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const data = await api<{ user: User }>('/user/profile', { auth: true });
      setUser(data.user);
    } catch {
      setToken(null);
      setUser(null);
    }
  }

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, []);

  async function login(email: string, password: string) {
    const data = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setToken(data.token);
    setUser(data.user);
  }

  async function register(name: string, email: string, password: string) {
    const data = await api<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, ready, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
