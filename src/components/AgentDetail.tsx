import React from 'react';
import { MOCK_AGENT_EVENTS } from '../data';
import type { Agent, AgentStatus } from '../types';

interface AgentDetailProps {
    agent: Agent;
    onClose: () => void;
    onStatusChange: (id: string, status: AgentStatus) => void;
    onRevoke: (id: string) => void;
}

const STATUS_META: Record<AgentStatus, { label: string; class: string; dot: string }> = {
    running: { label: 'Running', class: 'status-running', dot: '🟢' },
    idle: { label: 'Idle', class: 'status-idle', dot: '⚪' },
    waiting_approval: { label: 'Awaiting Approval', class: 'status-approval', dot: '🟡' },
    error: { label: 'Error', class: 'status-error', dot: '🔴' },
    paused: { label: 'Paused', class: 'status-paused', dot: '🟠' },
};

const EVENT_ICONS: Record<string, string> = {
    task_start: '▶',
    task_complete: '✓',
    info: 'ℹ',
    approval_req: '⏳',
    error: '✗',
};

export const AgentDetail: React.FC<AgentDetailProps> = ({
    agent, onClose, onStatusChange, onRevoke,
}) => {
    const events = MOCK_AGENT_EVENTS.filter(e => e.agentId === agent.id);
    const meta = STATUS_META[agent.status];
    const isPaused = agent.status === 'paused';
    const isRunning = agent.status === 'running' || agent.status === 'waiting_approval';

    const [showRevoke, setShowRevoke] = React.useState(false);

    return (
        <div className="agent-detail-overlay" onClick={onClose}>
            <div className="agent-detail-panel glass-panel" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="agent-detail-header">
                    <div>
                        <h2 className="agent-detail-name">{agent.name}</h2>
                        <span className={`agent-status-badge ${meta.class}`}>
                            {meta.dot} {meta.label}
                        </span>
                    </div>
                    <button className="btn-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                {/* Stats row */}
                <div className="agent-detail-stats">
                    <div className="astat">
                        <div className="astat-label">Total Spend</div>
                        <div className="astat-value">${agent.totalSpend.toFixed(2)}</div>
                    </div>
                    <div className="astat">
                        <div className="astat-label">Events</div>
                        <div className="astat-value">{agent.eventsCount}</div>
                    </div>
                    <div className="astat">
                        <div className="astat-label">Last Seen</div>
                        <div className="astat-value">{agent.lastSeen}</div>
                    </div>
                </div>

                {/* Token */}
                <div className="agent-token-row">
                    <span className="agent-token-label">Token Hash</span>
                    <code className="agent-token-value">{agent.tokenHash}</code>
                </div>

                {/* Controls */}
                <div className="agent-detail-controls">
                    {isPaused ? (
                        <button
                            className="btn-primary"
                            onClick={() => onStatusChange(agent.id, 'running')}
                        >
                            ▶ Resume Agent
                        </button>
                    ) : isRunning ? (
                        <button
                            className="btn-secondary"
                            onClick={() => onStatusChange(agent.id, 'paused')}
                        >
                            ⏸ Pause Agent
                        </button>
                    ) : null}

                    {!showRevoke ? (
                        <button className="btn-danger" onClick={() => setShowRevoke(true)}>
                            🗑 Revoke Token
                        </button>
                    ) : (
                        <div className="revoke-confirm">
                            <span>Are you sure? This will disconnect the agent.</span>
                            <button className="btn-danger" onClick={() => { onRevoke(agent.id); onClose(); }}>
                                Confirm Revoke
                            </button>
                            <button className="btn-outline" onClick={() => setShowRevoke(false)}>Cancel</button>
                        </div>
                    )}
                </div>

                {/* Event History */}
                <div className="agent-history">
                    <h3 className="agent-history-title">Event History</h3>
                    {events.length === 0 ? (
                        <p className="muted">No events recorded yet.</p>
                    ) : (
                        <div className="event-list">
                            {events.map(ev => (
                                <div key={ev.id} className={`event-item event-${ev.type}`}>
                                    <span className="event-icon">{EVENT_ICONS[ev.type] ?? '•'}</span>
                                    <div className="event-body">
                                        <p className="event-msg">{ev.message}</p>
                                        <div className="event-meta">
                                            <span className="event-type">{ev.type}</span>
                                            {ev.cost > 0 && <span className="event-cost">${ev.cost.toFixed(3)}</span>}
                                            <span className="event-time">{ev.createdAt}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
