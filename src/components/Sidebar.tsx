import React from 'react';
import { LogOut, X } from 'lucide-react';
import { NAV_ITEMS } from '../data';
import type { TabId } from '../types';

// Lucide-style SVG icons inline (no extra import needed for basic ones)
const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
    </svg>
);

// Tab icon SVGs map
const TAB_ICONS: Record<string, React.ReactNode> = {
    dashboard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    ),
    inbox: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
    ),
    workshop: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="8" height="18" x="2" y="3" rx="1" /><rect width="8" height="7" x="14" y="3" rx="1" /><rect width="8" height="7" x="14" y="14" rx="1" />
        </svg>
    ),
    momentum: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    ),
    spend: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 6v2m0 8v2" />
        </svg>
    ),
    scheduler: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    'multi-agent': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="3" /><line x1="12" y1="8" x2="12" y2="10" />
            <circle cx="5" cy="19" r="3" /><line x1="5" y1="16" x2="5" y2="14" /><line x1="5" y1="14" x2="12" y2="10" />
            <circle cx="19" cy="19" r="3" /><line x1="19" y1="16" x2="19" y2="14" /><line x1="19" y1="14" x2="12" y2="10" />
        </svg>
    ),
    comms: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    sleep: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    ),
    'fix-ui': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="14" x="3" y="3" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
            <circle cx="8" cy="6" r="1" fill="currentColor" /><circle cx="12" cy="6" r="1" fill="currentColor" />
        </svg>
    ),
    memory: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /><path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
        </svg>
    ),
    'key-vault': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" />
            <path d="m15.5 7.5 3 3L22 7l-3-3" /><path d="M7.5 16.5v-2m2 2h-4" />
        </svg>
    ),
    'ingest-api': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    ),
};

interface SidebarProps {
    activeTab: TabId;
    onNavigate: (tab: TabId) => void;
    inboxCount?: number;
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    onNavigate,
    inboxCount = 0,
    isOpen,
    onClose,
}) => {
    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-brand">
                    <div className="logo-icon">
                        <BotIcon />
                    </div>
                    <span className="logo-text">JARVIS MC</span>
                </div>
                <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Close navigation">
                    <X size={18} />
                </button>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                {NAV_ITEMS.map(item => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={e => { e.preventDefault(); onNavigate(item.id); }}
                    >
                        <span className="nav-icon">
                            {TAB_ICONS[item.id] ?? <span style={{ fontSize: '1rem' }}>{item.icon}</span>}
                        </span>
                        {item.label}
                        {item.id === 'inbox' && inboxCount > 0 && (
                            <span className="nav-badge">{inboxCount}</span>
                        )}
                    </a>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user-row">
                    <div className="sidebar-avatar">JD</div>
                    <div>
                        <div className="sidebar-user-name">Jarvis Operator</div>
                        <div className="sidebar-user-email">ops@jarvis.local</div>
                    </div>
                </div>
                <div className="status-online-row">
                    <div className="pulse-dot" />
                    <span>4 Agents Online</span>
                </div>
                <button type="button" className="sidebar-signout-btn">
                    <LogOut size={14} />
                    Sign out
                </button>
            </div>
        </aside>
    );
};
