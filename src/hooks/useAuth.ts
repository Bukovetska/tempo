import { useState, useEffect } from 'react';
import { User, UserSettings } from '../types';
import { apiLogin, apiRegister } from '../services/apiService';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
}

const SESSION_KEY = 'tempo_session';
const TOKEN_KEY   = 'tempo_token';

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
  });

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const user = JSON.parse(raw) as User;
      setAuth({ user, isLoggedIn: true });
    }
  }, []);

  async function login(email: string, password: string): Promise<string | null> {
    try {
      const { token, user } = await apiLogin(email, password);
      localStorage.setItem(TOKEN_KEY,   token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      setAuth({ user, isLoggedIn: true });
      return null;
    } catch (err: any) {
      return err.message ?? 'Помилка входу';
    }
  }

  async function register(
    name: string,
    email: string,
    password: string
  ): Promise<string | null> {
    try {
      const { token, user } = await apiRegister(name, email, password);
      localStorage.setItem(TOKEN_KEY,   token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));

      const defaultSettings: UserSettings = {
        timezone:             'Europe/Kyiv',
        notificationsEnabled: true,
        weeklyReportEnabled:  false,
        dailySummaryEnabled:  true,
      };

      const fullUser: User = { ...user, settings: defaultSettings };
      setAuth({ user: fullUser, isLoggedIn: true });
      return null;
    } catch (err: any) {
      return err.message ?? 'Помилка реєстрації';
    }
  }

  function loginWithToken(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY,   token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setAuth({ user, isLoggedIn: true });
  }

  function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    setAuth({ user: null, isLoggedIn: false });
  }

  return { auth, login, register, logout, loginWithToken };
}