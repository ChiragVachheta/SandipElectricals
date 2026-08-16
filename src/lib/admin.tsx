import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { FUNCTIONS_URL } from './supabase';

interface AdminContextValue {
  token: string | null;
  login: (username: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

const STORAGE_KEY = 'sandip_admin_token';

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${FUNCTIONS_URL}/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Login failed' }));
      return { error: body.error || 'Login failed' };
    }
    const data = await res.json();
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    return { error: null };
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await fetch(`${FUNCTIONS_URL}/admin-api/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, [token]);

  const authedFetch = useCallback(
    (path: string, init?: RequestInit) => {
      return fetch(`${FUNCTIONS_URL}/admin-api${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(init?.headers || {}),
        },
      });
    },
    [token]
  );

  return (
    <AdminContext.Provider value={{ token, login, logout, authedFetch }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
