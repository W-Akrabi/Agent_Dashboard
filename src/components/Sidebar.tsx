import React from 'react';
import { NAV_ITEMS } from '../data';
import type { TabId } from '../types';

interface SidebarProps {
    activeTab: TabId;
    onNavigate: (tab: TabId) => void;
    inboxCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, inboxCount = 0 }) => {
    return (
        <nav className="sidebar glass-panel">
            <div className="sidebar-header">
                <div className="logo" />
                <h2>Jarvis MC</h2>
            </div>

            <ul className="nav-links">
                {NAV_ITEMS.map((item) => (
                    <li key={item.id}>
                        <a
                            href={`#${item.id}`}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
                        >
                            <span className="icon">{item.icon}</span>
                            {item.label}
                            {item.id === 'inbox' && inboxCount > 0 && (
                                <span className="nav-badge">{inboxCount}</span>
                            )}
                        </a>
                    </li>
                ))}
            </ul>

            <div className="sidebar-footer">
                <div className="agent-status online">
                    <span className="status-dot" />
                    12 Agents Online
                </div>
            </div>
        </nav>
    );
};
