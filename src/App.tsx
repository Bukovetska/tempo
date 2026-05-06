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


const ACTIVE_PAGE_KEY = 'tempo_active_page';

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