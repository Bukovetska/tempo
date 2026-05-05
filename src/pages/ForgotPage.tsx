import React, { useState } from 'react';

interface ForgotPasswordPageProps {
  onBack: () => void;
}
type Step = 'email' | 'code';

const BASE_URL = 'http://localhost:5000/api';

export default function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [step, setStep]                 = useState<Step>('email');
  const [email, setEmail]               = useState<string>('');
  const [code, setCode]                 = useState<string>('');
  const [newPassword, setNewPassword]   = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError]               = useState<string>('');
  const [success, setSuccess]           = useState<string>('');
  const [loading, setLoading]           = useState<boolean>(false);

  async function handleRequestCode(): Promise<void> {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Введіть email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Невірний формат email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Помилка');
        return;
      }

      setSuccess('Якщо акаунт існує - код надіслано на пошту');
      setTimeout(() => {
        setStep('code');
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError('Помилка мережі');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(): Promise<void> {
    setError('');
    setSuccess('');

    if (!code.trim() || code.length !== 6) {
      setError('Введіть 6-значний код');
      return;
    }
    if (!newPassword) {
      setError('Введіть новий пароль');
      return;
    }
    if (newPassword.length < 6) {
      setError('Пароль має бути не менше 6 символів');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Помилка');
        return;
      }

      setSuccess('Пароль успішно змінено! Перенаправляємо на вхід...');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError('Помилка мережі');
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(value: string): void {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    setCode(clean);
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
          Не хвилюйтесь, допоможемо відновити доступ до акаунту.
        </p>
        <div style={{
          marginTop: '8px', fontSize: '48px',
          background: 'rgba(255,255,255,0.4)',
          borderRadius: '20px', padding: '20px 32px',
        }}>🔐</div>
      </div>

      <div className="login-form-wrap">
        <div className="login-form">
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none',
              color: '#8b72be', fontSize: '13px',
              fontWeight: 700, padding: 0, marginBottom: '12px',
              cursor: 'pointer',
            }}
          >
            ← Повернутись до входу
          </button>

          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#2e2640', marginBottom: '4px' }}>
            {step === 'email' ? 'Відновлення паролю' : 'Введіть код'}
          </h1>
          <p style={{ fontSize: '13px', color: '#9b8fb5', marginBottom: '24px' }}>
            {step === 'email'
              ? 'Введдіть email - надішлемо код для скидання паролю'
              : `Перевірьте  пошту ${email} і введіть код з листа`}
          </p>

          {step === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={`input ${error ? 'input-error' : ''}`}
                  autoFocus
                />
              </div>

              {error && <p className="error-text">⚠ {error}</p>}
              {success && (
                <p style={{ color: '#7aab8e', fontSize: '12px' }}>✓ {success}</p>
              )}

              <button
                onClick={handleRequestCode}
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '10px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Відправка...' : 'Надіслати код'}
              </button>
            </div>
          )}

          {step === 'code' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Код з листа (6 цифр)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="123456"
                  className={`input ${error ? 'input-error' : ''}`}
                  style={{
                    fontSize: '20px',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontFamily: 'Courier New, monospace',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="form-label">Новий пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Мінімум 6 символів"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Повторіть пароль</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Той самий пароль"
                  className="input"
                />
              </div>

              {error && <p className="error-text">⚠ {error}</p>}
              {success && (
                <p style={{ color: '#7aab8e', fontSize: '12px' }}>✓ {success}</p>
              )}

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '10px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Збереження...' : 'Змінити пароль'}
              </button>

              <button
                onClick={() => { setStep('email'); setCode(''); setNewPassword(''); setConfirmPassword(''); setError(''); }}
                style={{
                  background: 'none', border: 'none',
                  color: '#8b72be', fontSize: '12px',
                  marginTop: '4px', cursor: 'pointer',
                }}
              >
                Не отримали код? Спробуйте ще раз
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}