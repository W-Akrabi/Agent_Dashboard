import React, { useState } from 'react';
import { AUTOMATION_RULES } from '../data';

export const SleepMode: React.FC = () => {
    const [rules, setRules] = useState(AUTOMATION_RULES);
    const toggle = (id: string) =>
        setRules(rs => rs.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

    return (
        <section id="sleep" className="view-section active">
            <header className="section-header">
                <h1>Sleep Mode</h1>
                <p className="subtitle">Automation Rules</p>
            </header>
            <div className="content glass-panel">
                <div className="rule-list">
                    {rules.map(rule => {
                        const [conditionParts] = rule.condition
                            .split(/([^a-zA-Z\s]+\d[\d:–$]*[^a-zA-Z\s]*)/)
                            .filter(Boolean);
                        void conditionParts;
                        return (
                            <div key={rule.id} className="rule-item">
                                <div>
                                    <div className="rule-condition">IF <span>{rule.condition}</span></div>
                                    <div className="rule-action">THEN <span>{rule.action}</span></div>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={rule.enabled} onChange={() => toggle(rule.id)} />
                                    <span className="slider" />
                                </label>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
