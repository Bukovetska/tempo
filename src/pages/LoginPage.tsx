import React, { useState } from 'react';
import ForgotPasswordPage from './ForgotPage';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (name: string, email: string, password: string) => Promise<string | null>;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const GOOGLE_AUTH_URL = API_URL.replace('/api', '') + '/api/auth/google';

export default function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [showForgot, setShowForgot] = useState<boolean>(false);
  const [name, setName]             = useState<string>('');
  const [email, setEmail]           = useState<string>('');
  const [password, setPassword]     = useState<string>('');
  const [error, setError]           = useState<string>('');
  const [loading, setLoading]       = useState<boolean>(false);

  if (showForgot) {
    return <ForgotPasswordPage onBack={() => setShowForgot(false)} />;
  }

  async function handleSubmit(): Promise<void> {
    setError('');

    if (isRegister && !name.trim()) {
      setError("Введіть ім'я"); return;
    }
    if (isRegister && name.trim().length < 2) {
      setError("Ім'я занадто коротке"); return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('Введіть email'); return;
    }
    if (!emailRegex.test(email)) {
      setError('Невірний формат email'); return;
    }

    if (!password) {
      setError('Введіть пароль'); return;
    }
    if (password.length < 6) {
      setError('Пароль має бути не менше 6 символів'); return;
    }

    setLoading(true);

    if (isRegister) {
      const err = await onRegister(name, email, password);
      if (err) setError(err);
    } else {
      const err = await onLogin(email, password);
      if (err) setError(err);
    }

    setLoading(false);
  }

  function handleSwitch(): void {
    setIsRegister(!isRegister);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: '#8b72be', borderRadius: '14px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '22px', color: '#fff',
          }}>⏱</div>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#6a4faa', letterSpacing: '-1px' }}>
            Tempo
          </span>
        </div>
        <p style={{ color: '#9070c0', fontSize: '13px', textAlign: 'center', maxWidth: '220px', lineHeight: 1.6 }}>
          Плануй свій день. Відстежуй темп. Зростай щодня.
        </p>
        <div style={{
          marginTop: '8px', fontSize: '48px',
          background: 'rgba(255,255,255,0.4)',
          borderRadius: '20px', padding: '20px 32px',
        }}>🗓</div>
      </div>

      <div className="login-form-wrap">
        <div className="login-form">
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#2e2640', marginBottom: '4px' }}>
            {isRegister ? 'Створити акаунт' : 'Вхід до Tempo'}
          </h1>
          <p style={{ fontSize: '13px', color: '#9b8fb5', marginBottom: '24px' }}>
            {isRegister ? 'Вже є акаунт? ' : 'Ще немає акаунту? '}
            <button
              onClick={handleSwitch}
              style={{ background: 'none', border: 'none', color: '#8b72be', fontWeight: 700, fontSize: '13px', padding: 0, cursor: 'pointer' }}
            >
              {isRegister ? 'Увійти' : 'Зареєструватись'}
            </button>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isRegister && (
              <div>
                <label className="form-label">Ім'я</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Аня Коваль"
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className={`input ${error && !email ? 'input-error' : ''}`}
              />
            </div>

            <div>
              <label className="form-label">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`input ${error && !password ? 'input-error' : ''}`}
              />
              {error && <p className="error-text">⚠ {error}</p>}
            </div>
          </div>

          {!isRegister && (
            <div style={{ textAlign: 'right', margin: '6px 0 16px' }}>
              <button
                onClick={() => setShowForgot(true)}
                style={{
                  background: 'none', border: 'none',
                  color: '#8b72be', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Забули пароль?
              </button>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '10px', marginTop: isRegister ? '16px' : '0', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Завантаження...' : isRegister ? 'Зареєструватись' : 'Увійти'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e8e0f5' }} />
            <span style={{ fontSize: '12px', color: '#c0b4d8' }}>або</span>
            <div style={{ flex: 1, height: '1px', background: '#e8e0f5' }} />
          </div>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '10px' }}
            onClick={() => { window.location.href = GOOGLE_AUTH_URL; }}
          >
            Продовжити з Google
          </button>
        </div>
      </div>
    </div>
  );
}