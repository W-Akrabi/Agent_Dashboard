import React, { useState } from 'react';
import { MOCK_INBOX } from '../data';
import type { InboxItem, InboxItemStatus } from '../types';

interface InboxProps {
    onBadgeChange: (count: number) => void;
}

export const Inbox: React.FC<InboxProps> = ({ onBadgeChange }) => {
    const [items, setItems] = useState<InboxItem[]>(MOCK_INBOX);
    const [comments, setComments] = useState<Record<string, string>>({});

    const decide = (id: string, decision: InboxItemStatus) => {
        setItems(prev => {
            const updated = prev.map(it =>
                it.id === id ? { ...it, status: decision, comment: comments[id] || '' } : it
            );
            const pending = updated.filter(it => it.status === 'pending').length;
            onBadgeChange(pending);
            return updated;
        });
    };

    const pending = items.filter(i => i.status === 'pending');
    const resolved = items.filter(i => i.status !== 'pending');

    return (
        <section id="inbox" className="view-section active">
            <header className="section-header">
                <h1>Inbox</h1>
                <p className="subtitle">Approval Queue — {pending.length} awaiting decision</p>
            </header>

            {pending.length === 0 && (
                <div className="inbox-empty glass-panel">
                    <span className="inbox-empty-icon">✅</span>
                    <h3>All caught up!</h3>
                    <p>No pending approvals. Agents are running autonomously.</p>
                </div>
            )}

            <div className="inbox-list">
                {pending.map(item => (
                    <div key={item.id} className="inbox-card glass-panel">
                        <div className="inbox-card-header">
                            <div className="inbox-agent-badge">{item.agentName}</div>
                            <span className="inbox-time">{item.createdAt}</span>
                        </div>

                        <div className="inbox-section">
                            <div className="inbox-label">✔ Completed</div>
                            <p className="inbox-text">{item.completed}</p>
                        </div>

                        <div className="inbox-section">
                            <div className="inbox-label">→ Proposed Next Action</div>
                            <p className="inbox-text proposed">{item.proposedAction}</p>
                        </div>

                        <div className="inbox-comment-row">
                            <input
                                type="text"
                                placeholder="Optional comment or instruction..."
                                value={comments[item.id] || ''}
                                onChange={e => setComments(c => ({ ...c, [item.id]: e.target.value }))}
                                className="inbox-comment-input"
                            />
                        </div>

                        <div className="inbox-actions">
                            <button className="btn-approve" onClick={() => decide(item.id, 'approved')}>
                                ✓ Approve
                            </button>
                            <button className="btn-reject" onClick={() => decide(item.id, 'rejected')}>
                                ✗ Reject
                            </button>
                        </div>
                    </div>
                ))}

                {resolved.length > 0 && (
                    <div className="inbox-resolved-section">
                        <h3 className="inbox-resolved-title">Recent Decisions</h3>
                        {resolved.map(item => (
                            <div key={item.id} className={`inbox-card resolved glass-panel ${item.status}`}>
                                <div className="inbox-card-header">
                                    <div className="inbox-agent-badge">{item.agentName}</div>
                                    <div className={`inbox-decision-badge ${item.status}`}>
                                        {item.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                    </div>
                                    <span className="inbox-time">{item.createdAt}</span>
                                </div>
                                <p className="inbox-text muted">{item.proposedAction}</p>
                                {item.comment && (
                                    <p className="inbox-comment-display">"{item.comment}"</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
