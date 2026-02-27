import React, { useState, useEffect } from 'react';
import { Bell, FileText, Menu } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from '../views/Dashboard';
import { Inbox } from '../views/Inbox';
import { Workshop } from '../views/Workshop';
import { Momentum } from '../views/Momentum';
import { ApiSpend } from '../views/ApiSpend';
import { Scheduler } from '../views/Scheduler';
import { MultiAgent } from '../views/MultiAgent';
import { CommsHub } from '../views/CommsHub';
import { SleepMode } from '../views/SleepMode';
import { FixUI } from '../views/FixUI';
import { Memory } from '../views/Memory';
import { KeyVault } from '../views/KeyVault';
import { IngestApi } from '../views/IngestApi';
import type { TabId } from '../types';
import { MOCK_INBOX } from '../data';
import './legacy.css';

const TAB_LABELS: Record<TabId, string> = {
  dashboard: 'Dashboard',
  inbox: 'Inbox',
  workshop: 'Workshop',
  momentum: 'Momentum',
  spend: 'API Spend',
  scheduler: 'Scheduler',
  'multi-agent': 'Multi-Agent',
  comms: 'Comms Hub',
  sleep: 'Sleep Mode',
  'fix-ui': 'Fix UI',
  memory: 'Memory',
  'key-vault': 'Key Vault',
  'ingest-api': 'The Glue',
};

export default function LegacyMissionControl() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inboxCount, setInboxCount] = useState(
    MOCK_INBOX.filter(i => i.status === 'pending').length
  );

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div style={{ textAlign: 'center' }}>
          <div className="spin" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-3)', letterSpacing: '0.12em' }}>
            INITIALIZING...
          </p>
        </div>
      </div>
    );
  }

  const handleNavigate = (tab: TabId) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const views: Array<[TabId, React.ReactNode]> = [
    ['dashboard', <Dashboard onOpenTab={handleNavigate} />],
    ['inbox', <Inbox onBadgeChange={setInboxCount} />],
    ['workshop', <Workshop />],
    ['momentum', <Momentum />],
    ['spend', <ApiSpend />],
    ['scheduler', <Scheduler />],
    ['multi-agent', <MultiAgent />],
    ['comms', <CommsHub />],
    ['sleep', <SleepMode />],
    ['fix-ui', <FixUI />],
    ['memory', <Memory />],
    ['key-vault', <KeyVault />],
    ['ingest-api', <IngestApi />],
  ];

  return (
    <>
      <div className="hud-frame">
        <div className="hud-frame-edge left" />
        <div className="hud-frame-edge right" />
      </div>
      <div className="scanlines" />
      <div className="starfield" />

      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className="app-shell">
        <Sidebar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          inboxCount={inboxCount}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="main-content">
          <header className="top-header">
            <div className="header-left">
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>
              <h1>{TAB_LABELS[activeTab]}</h1>
            </div>
            <div className="header-right">
              <button
                type="button"
                className="header-icon-btn"
                onClick={() => handleNavigate('inbox')}
                aria-label="Open inbox"
              >
                <Bell size={16} />
                {inboxCount > 0 && <span className="header-dot" />}
              </button>
              <button type="button" className="header-link-btn">
                <FileText size={15} />
                Docs
              </button>
              <div className="header-pill">
                <div className="pulse-dot" style={{ width: 6, height: 6 }} />
                Live
              </div>
            </div>
          </header>

          {views.map(([id, view]) => (
            <div key={id} className="page-content" style={{ display: activeTab === id ? 'block' : 'none' }}>
              <div className={activeTab === id ? 'tab-enter' : ''}>{view}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
