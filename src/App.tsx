import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Sidebar, { Page } from './components/Sidebar';
import LoginPage        from './pages/LoginPage';
import DayPage          from './pages/DayPage';
import MonthPage        from './pages/MonthPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import SettingsPage     from './pages/SettingsPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { User, UserSettings } from './types';

// ключ під яким зберігаємо активну сторінку в localStorage
// зберігаємо лише назву поточної сторінки щоб після F5 юзер не вертався на День
const ACTIVE_PAGE_KEY = 'tempo_active_page';

// допоміжна функція - читаємо збережену сторінку з localStorage
// якщо нічого не збережено або зіпсуте значення - повертаємо 'day' за замовчуванням
function getInitialPage(): Page {
  const saved = localStorage.getItem(ACTIVE_PAGE_KEY);
  if (saved === 'day' || saved === 'month' || saved === 'analytics' || saved === 'settings') {
    return saved;
  }
  return 'day';
}

export default function App() {
  const { auth, login, register, logout, loginWithToken } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // зберігаємо вибір сторінки коли він міняється
  // useEffect спрацьовує щоразу як currentPage оновлюється
  useEffect(() => {
    localStorage.setItem(ACTIVE_PAGE_KEY, currentPage);
  }, [currentPage]);

  const user = currentUser ?? auth.user;

  const isCallback = window.location.pathname === '/auth/callback' ||
                   window.location.href.includes('/auth/callback');

  if (isCallback) {
    return (
      <AuthCallbackPage
        onSuccess={(token, rawUser) => {
          const defaultSettings: UserSettings = {
            timezone:             'Europe/Kyiv',
            notificationsEnabled: true,
            weeklyReportEnabled:  false,
            dailySummaryEnabled:  true,
          };
          const fullUser: User = {
            ...rawUser,
            settings: defaultSettings,
            password: '',
            createdAt: new Date().toISOString()
          };
          loginWithToken(token, fullUser);
          window.location.href = '/';
        }}
      />
    );
  }

  if (!auth.isLoggedIn || !user) {
    return <LoginPage onLogin={login} onRegister={register} />;
  }

  function handleUpdate(updated: User): void {
    setCurrentUser(updated);
  }

  // обгортаємо logout щоб ще видаляти збережену сторінку
  // інакше при наступному вході юзер відразу попаде на ту що останньо була
  function handleLogout(): void {
    localStorage.removeItem(ACTIVE_PAGE_KEY);
    logout();
  }

  function renderPage() {
    if (!user) return null;
    if (currentPage === 'day') {
      return <DayPage userId={user.id} />;
    }
    if (currentPage === 'month') {
      return <MonthPage userId={user.id} />;
    }
    if (currentPage === 'analytics') {
      return <AnalyticsPage userId={user.id} />;
    }
    if (currentPage === 'settings') {
      return <SettingsPage user={user} onLogout={handleLogout} onUpdate={handleUpdate} />;
    }
    // якщо щось дивне - показуємо День
    return <DayPage userId={user.id} />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        activePage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        userName={user.name}
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}