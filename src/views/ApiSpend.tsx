import React, { useState } from 'react';
import { AGENT_SPEND } from '../data';

export const ApiSpend: React.FC = () => {
    const [budget, setBudget] = useState(1500);
    const [editBudget, setEdit] = useState(false);
    const [draftBudget, setDraft] = useState('1500');

    const spent = 1250;
    const pct = Math.min(100, Math.round((spent / budget) * 100));
    const isOver80 = pct >= 80;

    const saveBudget = () => {
        const val = parseFloat(draftBudget);
        if (!isNaN(val) && val > 0) setBudget(val);
        setEdit(false);
    };

    return (
        <section id="spend" className="view-section active">
            <header className="section-header">
                <h1>API Spend</h1>
                <p className="subtitle">Cost Tracking</p>
            </header>

            <div className="content glass-panel" id="spend-content">
                <div className="spend-stats">

                    {/* Monthly Budget card with editable cap */}
                    <div className="stat-card glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 style={{ margin: 0 }}>Monthly Budget</h3>
                            {!editBudget && (
                                <button className="btn-outline sm" onClick={() => { setEdit(true); setDraft(String(budget)); }}>
                                    Edit Cap
                                </button>
                            )}
                        </div>

                        {editBudget ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>$</span>
                                <input
                                    type="number"
                                    value={draftBudget}
                                    onChange={e => setDraft(e.target.value)}
                                    className="modal-input"
                                    style={{ width: '120px', padding: '8px 12px' }}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && saveBudget()}
                                />
                                <button className="btn-primary sm" onClick={saveBudget}>Save</button>
                                <button className="btn-outline sm" onClick={() => setEdit(false)}>Cancel</button>
                            </div>
                        ) : (
                            <div className="stat-value">${spent.toLocaleString()}<span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}> / ${budget.toLocaleString()}</span></div>
                        )}

                        <div className="progress-bar-container">
                            <div className={`progress-fill ${isOver80 ? 'warning' : ''}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: isOver80 ? 'var(--status-warning)' : 'var(--text-muted)' }}>
                            {pct}% of monthly cap used
                        </div>
                    </div>

                    {/* Today's spend */}
                    <div className="stat-card glass-panel">
                        <h3>Today's Spend</h3>
                        <div className="stat-value">$42.50</div>
                        <div className="stat-trend warning">High Usage</div>
                    </div>
                </div>

                {/* Spend by agent */}
                <div className="spend-breakdown">
                    <h3>Spend by Agent</h3>
                    <ul className="agent-spend-list">
                        {AGENT_SPEND.map(a => (
                            <li key={a.name}>
                                <span>{a.name}</span>
                                <span>{a.amount}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};
