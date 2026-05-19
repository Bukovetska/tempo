import React, { useState, useEffect } from 'react';
import { User, UserSettings } from '../types';
import {
  apiFetchCategories,
  apiDeleteCategory,
  apiUpdateSettings,
  ApiCategory,
} from '../services/apiService';

interface SettingsPageProps {
  user: User;
  onLogout: () => void;
  onUpdate: (updated: User) => void;
}

const DEFAULT_CATS = ['work', 'study', 'personal', 'health'];

export default function SettingsPage({ user, onLogout, onUpdate }: SettingsPageProps) {
  const [name, setName]         = useState<string>(user.name);
  const initialSettings: UserSettings = user.settings || {
    timezone: 'Europe/Kyiv',
    notificationsEnabled: true,
    weeklyReportEnabled: false,
    dailySummaryEnabled: true,
  };
  const [timezone, setTimezone] = useState<string>(initialSettings.timezone);
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [saved, setSaved]       = useState<boolean>(false);
  const [saving, setSaving]     = useState<boolean>(false);
  const [error, setError]       = useState<string>('');
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    apiFetchCategories().then(setCategories).catch(console.error);
  }, []);

  function toggleSetting(key: keyof UserSettings): void {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    setError('');
    try {
      const updated = await apiUpdateSettings({
        name,
        timezone,
        notificationsEnabled: settings.notificationsEnabled,
        weeklyReportEnabled:  settings.weeklyReportEnabled,
        dailySummaryEnabled:  settings.dailySummaryEnabled,
      });

      const updatedUser: User = {
        ...user,
        name: updated.name,
        settings: updated.settings,
      };
      localStorage.setItem('tempo_session', JSON.stringify(updatedUser));
      onUpdate(updatedUser);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не вдалось зберегти';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(id: string): Promise<void> {
    if (DEFAULT_CATS.includes(id)) {
      alert('Дефолтні категорії видалити не можна');
      return;
    }
    if (!window.confirm('Точно видалити категорію?')) return;

    await apiDeleteCategory(id);
    const updated = await apiFetchCategories();
    setCategories(updated);
  }

  const toggleItems: { key: keyof UserSettings; label: string; desc: string }[] = [
    { key: 'notificationsEnabled', label: 'Email-нагадування', desc: 'Лист на пошту за 15 хв до задачі' },
    { key: 'dailySummaryEnabled',  label: 'Щоденний підсумок',  desc: 'Звіт про виконані задачі о 23:00' },
    { key: 'weeklyReportEnabled',  label: 'Тижневий звіт',      desc: 'Звіт за тиждень щонеділі о 20:00' },
  ];

  const customCategories = categories.filter((c) => !DEFAULT_CATS.includes(c.id));

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: '24px' }}>Налаштування</h1>

      <div className="settings-grid">
        <div className="settings-avatar-block">
          <div className="settings-avatar">{name.charAt(0).toUpperCase()}</div>
          <p className="settings-avatar-name">{name}</p>
          <p className="settings-avatar-email">{user.email}</p>
        </div>

        <div className="settings-content">
          <div className="card">
            <p className="section-label">Профіль</p>
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label">Ім'я</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input disabled-input"
              />
            </div>
            <div>
              <label className="form-label">Часовий пояс</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="input"
              >
                <option value="Europe/Kyiv">Europe/Kyiv (Київ)</option>
                <option value="Europe/Warsaw">Europe/Warsaw (Варшава)</option>
                <option value="Europe/London">Europe/London (Лондон)</option>
                <option value="Europe/Berlin">Europe/Berlin (Берлін)</option>
                <option value="UTC">UTC</option>
              </select>
              <p className="alert-info">Впливає на час нагадувань та звітів</p>
            </div>
          </div>

          <div className="card">
            <p className="section-label">Email-сповіщення</p>
            {toggleItems.map((item) => (
              <div key={item.key} className="toggle-row">
                <div>
                  <p className="toggle-row-label">{item.label}</p>
                  <p className="toggle-row-desc">{item.desc}</p>
                </div>
                <button
                  className={`toggle ${settings[item.key] ? 'on' : ''}`}
                  onClick={() => toggleSetting(item.key)}
                >
                  <div className="toggle-thumb" />
                </button>
              </div>
            ))}
          </div>

          {customCategories.length > 0 && (
            <div className="card">
              <p className="section-label">Мої категорії</p>
              <div className="cat-list">
                {customCategories.map((cat) => (
                  <div key={cat.id} className="cat-list-item">
                    <div className="cat-list-color" style={{ background: cat.color }} />
                    <span className="cat-list-label">{cat.label}</span>
                    <button
                      className="cat-list-delete"
                      onClick={() => handleDeleteCategory(cat.id)}
                      title="Видалити"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="error-banner">⚠ {error}</div>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-primary"
              style={{ flex: 1, padding: '10px' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Збереження...' : saved ? '✓ Збережено' : 'Зберегти зміни'}
            </button>
            <button className="btn-logout" onClick={onLogout}>Вийти</button>
          </div>
        </div>
      </div>
    </div>
  );
}