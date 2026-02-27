import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { Inbox } from './views/Inbox';
import { Workshop } from './views/Workshop';
import { Momentum } from './views/Momentum';
import { ApiSpend } from './views/ApiSpend';
import { Scheduler } from './views/Scheduler';
import { MultiAgent } from './views/MultiAgent';
import { CommsHub } from './views/CommsHub';
import { SleepMode } from './views/SleepMode';
import { FixUI } from './views/FixUI';
import { Memory } from './views/Memory';
import { KeyVault } from './views/KeyVault';
import { IngestApi } from './views/IngestApi';
import type { TabId } from './types';
import { MOCK_INBOX } from './data';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [inboxCount, setInboxCount] = useState(
    MOCK_INBOX.filter(i => i.status === 'pending').length
  );

  type ViewEntry = [TabId, React.ReactNode];

  const views: ViewEntry[] = [
    ['dashboard', <Dashboard />],
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
      <div className="bg-mesh">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      <div className="app-container">
        <Sidebar activeTab={activeTab} onNavigate={setActiveTab} inboxCount={inboxCount} />

        <main className="main-content">
          {views.map(([id, view]) => (
            <div
              key={id}
              style={{ display: activeTab === id ? 'block' : 'none' }}
              className={activeTab === id ? 'tab-active' : ''}
            >
              {view}
            </div>
          ))}
        </main>
      </div>
    </>
  );
};
