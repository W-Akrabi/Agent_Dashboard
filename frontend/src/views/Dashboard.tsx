import React, { useMemo, useState } from 'react';
import {
    Activity,
    BellDot,
    Bot,
    DollarSign,
    Inbox,
    Pause,
    Play,
    Wallet,
} from 'lucide-react';
import { ACTIVITIES, MOCK_AGENTS } from '../data';
import { AgentDetail } from '../components/AgentDetail';
import type { Agent, AgentStatus, TabId } from '../types';

function generateToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return 'sk-jmc-' + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateId() {
    return 'agt-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

interface DashboardProps {
    onOpenTab?: (tab: TabId) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenTab }) => {
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

    const STATUS_META: Record<AgentStatus, { label: string; className: string }> = {
        running: { label: 'Running', className: 'dash-status-running' },
        idle: { label: 'Idle', className: 'dash-status-idle' },
        waiting_approval: { label: 'Waiting', className: 'dash-status-waiting' },
        error: { label: 'Error', className: 'dash-status-error' },
        paused: { label: 'Paused', className: 'dash-status-paused' },
    };

    const pendingApprovals = agents.filter(a => a.status === 'waiting_approval').length;
    const activeAgents = agents.filter(a => a.status === 'running').length;
    const dailySpend = 42.5;
    const monthlyBudget = 1500;
    const monthlySpend = 1125;
    const budgetPercent = Math.min(100, Math.round((monthlySpend / monthlyBudget) * 100));

    const activityRows = useMemo(
        () =>
            ACTIVITIES.map((activity, idx) => {
                const types = ['Tool', 'Approval', 'Completion', 'Action', 'Error'];
                const type = types[idx % types.length];
                return {
                    ...activity,
                    type,
                    cost: (0.01 + idx * 0.01).toFixed(2),
                };
            }),
        []
    );

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

                <header className="section-header dashboard-header-kimi">
                    <div className="dashboard-header-inner">
                        <div>
                            <h1>Dashboard</h1>
                            <p className="subtitle">Live Status Overview</p>
                        </div>
                        <button className="btn-primary" onClick={() => { setShowRegister(true); setNewAgentResult(null); setNewAgentName(''); }}>
                            + Register Agent
                        </button>
                    </div>
                </header>

                <div className="dashboard-stats-kimi">
                    <article className="stat-card glass-panel stat-kimi">
                        <div className="stat-kimi-head">
                            <h3>Active Agents</h3>
                            <span className="stat-kimi-icon blue">
                                <Bot size={14} />
                            </span>
                        </div>
                        <div className="stat-value">{activeAgents}</div>
                        <div className="stat-trend">of {agents.length} total</div>
                    </article>

                    <article className="stat-card glass-panel stat-kimi">
                        <div className="stat-kimi-head">
                            <h3>Pending Approvals</h3>
                            <span className="stat-kimi-icon amber">
                                <Inbox size={14} />
                            </span>
                        </div>
                        <div className="stat-value">{pendingApprovals}</div>
                        <button className="link-accent" onClick={() => onOpenTab?.('inbox')}>View inbox →</button>
                    </article>

                    <article className="stat-card glass-panel stat-kimi">
                        <div className="stat-kimi-head">
                            <h3>Today's Spend</h3>
                            <span className="stat-kimi-icon green">
                                <DollarSign size={14} />
                            </span>
                        </div>
                        <div className="stat-value">${dailySpend.toFixed(2)}</div>
                        <div className="stat-trend positive">~ +12% vs yesterday</div>
                    </article>

                    <article className="stat-card glass-panel stat-kimi">
                        <div className="stat-kimi-head">
                            <h3>Monthly Budget</h3>
                            <span className="stat-kimi-icon purple">
                                <Activity size={14} />
                            </span>
                        </div>
                        <div className="stat-value">{budgetPercent}%</div>
                        <div className="progress-track budget-progress-kimi">
                            <div className="progress-fill" style={{ width: `${budgetPercent}%` }} />
                        </div>
                    </article>
                </div>

                <div className="dashboard-layout-kimi">
                    <div className="dashboard-left-kimi">
                        <div className="dashboard-section-head-kimi">
                            <h2>Your Agents</h2>
                            <button className="link-accent" onClick={() => onOpenTab?.('multi-agent')}>View all →</button>
                        </div>

                        <div className="dashboard-agents-grid-kimi">
                            {agents.map(agent => {
                                const meta = STATUS_META[agent.status];
                                const isPaused = agent.status === 'paused';

                                return (
                                    <div
                                        key={agent.id}
                                        className="agent-card glass-panel agent-card-kimi"
                                        onClick={() => setSelectedAgent(agent)}
                                    >
                                        <div className="agent-card-kimi-head">
                                            <div className="agent-card-kimi-title">
                                                <span className="agent-card-kimi-icon">
                                                    <Bot size={14} />
                                                </span>
                                                <div>
                                                    <div className="agent-card-name">{agent.name}</div>
                                                    <div className={`agent-status-line ${meta.className}`}>
                                                        {meta.label}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="agent-toggle-kimi"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleStatusChange(agent.id, isPaused ? 'running' : 'paused');
                                                }}
                                                aria-label={isPaused ? 'Resume agent' : 'Pause agent'}
                                            >
                                                {isPaused ? <Play size={14} /> : <Pause size={14} />}
                                            </button>
                                        </div>

                                        <div className="agent-card-stats">
                                            <div className="astat-mini">
                                                <span className="astat-mini-label">Total Spend</span>
                                                <span className="astat-mini-value">${agent.totalSpend.toFixed(2)}</span>
                                            </div>
                                            <div className="astat-mini">
                                                <span className="astat-mini-label">Events</span>
                                                <span className="astat-mini-value">{agent.eventsCount}</span>
                                            </div>
                                        </div>

                                        <button
                                            className="link-accent agent-detail-link-kimi"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setSelectedAgent(agent);
                                            }}
                                        >
                                            View details →
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <aside className="activity-feed glass-panel dashboard-activity-kimi">
                        <div className="dashboard-section-head-kimi">
                            <h2>Live Activity</h2>
                            <span className="live-indicator-kimi">
                                <span className="dot" />
                                Live
                            </span>
                        </div>

                        <div className="dashboard-activity-list-kimi">
                            {activityRows.map((row, idx) => (
                                <div key={idx} className="dashboard-activity-item-kimi">
                                    <div className="dashboard-activity-top-kimi">
                                        <span className="dashboard-activity-agent-kimi">{row.agent}</span>
                                        <span className={`dashboard-activity-type-kimi type-${row.type.toLowerCase()}`}>
                                            {row.type}
                                        </span>
                                    </div>
                                    <p className="dashboard-activity-msg-kimi">{row.msg}</p>
                                    <div className="dashboard-activity-meta-kimi">
                                        <span className="dashboard-activity-cost-kimi">${row.cost}</span>
                                        <span>{row.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>

                <div className="dashboard-quick-actions-kimi glass-panel">
                    <h2>Quick Actions</h2>
                    <div className="dashboard-quick-actions-row-kimi">
                        <button className="btn-primary" onClick={() => { setShowRegister(true); setNewAgentResult(null); setNewAgentName(''); }}>
                            <BellDot size={14} />
                            Register Agent
                        </button>
                        <button className="btn-secondary" onClick={() => onOpenTab?.('inbox')}>
                            <Inbox size={14} />
                            Review Approvals
                        </button>
                        <button className="btn-secondary" onClick={() => onOpenTab?.('spend')}>
                            <Wallet size={14} />
                            View Spend
                        </button>
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
