import React, { useState, useEffect } from 'react';

export type Page = 'day' | 'month' | 'analytics' | 'settings';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  userName: string;
}

interface NavItem {
  page: Page;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: 'day',       label: 'День',         icon: '📅' },
  { page: 'month',     label: 'Місяць',       icon: '🗓' },
  { page: 'analytics', label: 'Аналітика',    icon: '📊' },
  { page: 'settings',  label: 'Налаштування', icon: '⚙️' },
];

export default function Sidebar({ activePage, onNavigate, onLogout, userName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    function handleResize(): void {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function handleNavigate(page: Page): void {
    onNavigate(page);
    if (isMobile) setIsOpen(false);
  }

  return (
    <>
      {isMobile && (
        <button className="burger-button" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? '✕' : '☰'}
        </button>
      )}

      {isMobile && isOpen && (
        <div className="sidebar-overlay open" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">⏱ Tempo</div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.page}
            className={`sidebar-item ${activePage === item.page ? 'active' : ''}`}
            onClick={() => handleNavigate(item.page)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div className="sidebar-spacer" />

        <div className="sidebar-footer">
          Привіт,<br /><strong>{userName}</strong>
        </div>
      </aside>
    </>
  );
}