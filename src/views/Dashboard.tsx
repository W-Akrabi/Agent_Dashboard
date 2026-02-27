import React, { useState } from 'react';
import { ACTIVITIES, BAR_DATA, MOCK_AGENTS } from '../data';
import { AgentDetail } from '../components/AgentDetail';
import type { Agent, AgentStatus } from '../types';

function generateToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return 'sk-jmc-' + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateId() {
    return 'agt-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export const Dashboard: React.FC = () => {
    const [alertVisible, setAlertVisible] = useState(true);
    const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [showRegister, setShowRegister] = useState(false);
    const [newAgentName, setNewAgentName] = useState('');
    const [newAgentResult, setNewAgentResult] = useState<{ id: string; token: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleStatusChange = (id: string, status: AgentStatus) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        setSelectedAgent(prev => prev?.id === id ? { ...prev, status } : prev);
    };

    const handleRevoke = (id: string) => {
        setAgents(prev => prev.filter(a => a.id !== id));
        setSelectedAgent(null);
    };

    const handleRegister = () => {
        if (!newAgentName.trim()) return;
        const id = generateId();
        const token = generateToken();
        const agent: Agent = {
            id,
            name: newAgentName.trim(),
            status: 'idle',
            totalSpend: 0,
            lastSeen: 'Just now',
            tokenHash: token.slice(0, 14) + '••••••••••••••••••••••',
            eventsCount: 0,
        };
        setAgents(prev => [...prev, agent]);
        setNewAgentResult({ id, token });
    };

    const copy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    };

    const STATUS_META: Record<AgentStatus, { label: string; dot: string; color: string }> = {
        running: { label: 'Running', dot: '🟢', color: 'var(--status-online)' },
        idle: { label: 'Idle', dot: '⚪', color: 'var(--text-muted)' },
        waiting_approval: { label: 'Needs Approval', dot: '🟡', color: 'var(--status-warning)' },
        error: { label: 'Error', dot: '🔴', color: 'var(--status-error)' },
        paused: { label: 'Paused', dot: '🟠', color: '#f97316' },
    };

    const pendingApprovals = agents.filter(a => a.status === 'waiting_approval').length;

    return (
        <>
            <section id="dashboard" className="view-section active">
                {alertVisible && (
                    <div className="alert-banner warning">
                        <span className="alert-icon">⚠️</span>
                        <span className="alert-text">Warning: Monthly API spend is at 92% of your budget limit.</span>
                        <button className="btn-close" onClick={() => setAlertVisible(false)}>×</button>
                    </div>
                )}

                <header className="section-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1>Dashboard</h1>
                            <p className="subtitle">Live Status Overview</p>
                        </div>
                        <button className="btn-primary" onClick={() => { setShowRegister(true); setNewAgentResult(null); setNewAgentName(''); }}>
                            + Register Agent
                        </button>
                    </div>
                </header>

                {/* Summary Stats */}
                <div className="dashboard-grid">
                    <div className="stat-card glass-panel">
                        <h3>Active Agents</h3>
                        <div className="stat-value">{agents.filter(a => a.status === 'running').length}</div>
                        <div className="stat-trend positive">of {agents.length} total agents</div>
                    </div>
                    <div className="stat-card glass-panel">
                        <h3>Today's Spend</h3>
                        <div className="stat-value">$42.50</div>
                        <div className="stat-trend warning">↑ 15% from avg</div>
                    </div>
                    <div className="stat-card glass-panel">
                        <h3>Pending Approvals</h3>
                        <div className="stat-value">{pendingApprovals}</div>
                        {pendingApprovals > 0
                            ? <div className="stat-trend warning">Awaiting your review</div>
                            : <div className="stat-trend positive">All clear</div>
                        }
                    </div>
                </div>

                {/* Agent Cards Grid */}
                <h2 className="section-subheading">Agents</h2>
                <div className="agents-grid">
                    {agents.map(agent => {
                        const meta = STATUS_META[agent.status];
                        return (
                            <div
                                key={agent.id}
                                className="agent-card glass-panel"
                                onClick={() => setSelectedAgent(agent)}
                            >
                                <div className="agent-card-header">
                                    <span className="agent-card-name">{agent.name}</span>
                                    <span className="agent-card-status" style={{ color: meta.color }}>
                                        {meta.dot} {meta.label}
                                    </span>
                                </div>
                                <div className="agent-card-stats">
                                    <div className="astat-mini">
                                        <span className="astat-mini-label">Spend</span>
                                        <span className="astat-mini-value">${agent.totalSpend.toFixed(2)}</span>
                                    </div>
                                    <div className="astat-mini">
                                        <span className="astat-mini-label">Events</span>
                                        <span className="astat-mini-value">{agent.eventsCount}</span>
                                    </div>
                                    <div className="astat-mini">
                                        <span className="astat-mini-label">Last Seen</span>
                                        <span className="astat-mini-value">{agent.lastSeen}</span>
                                    </div>
                                </div>
                                <div className="agent-card-footer">
                                    <button
                                        className={agent.status === 'paused' ? 'btn-primary sm' : 'btn-secondary sm'}
                                        onClick={e => { e.stopPropagation(); handleStatusChange(agent.id, agent.status === 'paused' ? 'running' : 'paused'); }}
                                    >
                                        {agent.status === 'paused' ? '▶ Resume' : '⏸ Pause'}
                                    </button>
                                    <button
                                        className="btn-outline sm"
                                        onClick={e => { e.stopPropagation(); setSelectedAgent(agent); }}
                                    >
                                        View Details →
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Activity Feed + Chart */}
                <div className="dashboard-split" style={{ marginTop: '32px' }}>
                    <div className="activity-feed glass-panel">
                        <h2>Live Activity Feed</h2>
                        <ul className="feed-list">
                            {ACTIVITIES.map((a, i) => (
                                <li key={i} className="feed-item">
                                    <div className="feed-time">{a.time}</div>
                                    <div className="feed-content">
                                        <div className="feed-agent">{a.agent}</div>
                                        <div className="feed-msg">{a.msg}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="activity-chart glass-panel">
                        <h2>7-Day Activity</h2>
                        <div className="chart-placeholder">
                            <div className="bar-chart">
                                {BAR_DATA.map(b => (
                                    <div key={b.day} className={`bar ${b.active ? 'active' : ''}`} style={{ height: `${b.pct}%` }} title={b.day} />
                                ))}
                            </div>
                        </div>
                        <div className="bar-labels">
                            {BAR_DATA.map(b => <span key={b.day} className="bar-label">{b.day}</span>)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Agent Detail Panel */}
            {selectedAgent && (
                <AgentDetail
                    agent={agents.find(a => a.id === selectedAgent.id) ?? selectedAgent}
                    onClose={() => setSelectedAgent(null)}
                    onStatusChange={handleStatusChange}
                    onRevoke={handleRevoke}
                />
            )}

            {/* Register Agent Modal */}
            {showRegister && (
                <div className="modal-overlay" onClick={() => setShowRegister(false)}>
                    <div className="modal-panel glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Register New Agent</h2>
                            <button className="btn-close" onClick={() => setShowRegister(false)}>×</button>
                        </div>

                        {!newAgentResult ? (
                            <>
                                <p className="modal-desc">Give your agent a name. A unique <code>agent_id</code> and <code>agent_token</code> will be generated.</p>
                                <div className="form-group">
                                    <label>Agent Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Outreach Agent"
                                        value={newAgentName}
                                        onChange={e => setNewAgentName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                                        className="modal-input"
                                        autoFocus
                                    />
                                </div>
                                <button className="btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={handleRegister}>
                                    Generate Credentials
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="modal-desc success">✅ Agent registered successfully! Copy your credentials — the token is shown <strong>only once</strong>.</p>
                                <div className="credential-box">
                                    <div className="cred-row">
                                        <span className="cred-label">agent_id</span>
                                        <code className="cred-value">{newAgentResult.id}</code>
                                    </div>
                                    <div className="cred-row">
                                        <span className="cred-label">agent_token</span>
                                        <code className="cred-value token">{newAgentResult.token}</code>
                                    </div>
                                    <button className="btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={() => copy(`agent_id: ${newAgentResult.id}\nagent_token: ${newAgentResult.token}`)}>
                                        {copied ? '✓ Copied!' : 'Copy Credentials'}
                                    </button>
                                </div>
                                <button className="btn-secondary" style={{ marginTop: '12px', width: '100%' }} onClick={() => setShowRegister(false)}>
                                    Done
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
