import React from 'react';
import { MEMORY_ENTRIES } from '../data';

export const Memory: React.FC = () => (
    <section id="memory" className="view-section active">
        <header className="section-header">
            <h1>Memory</h1>
            <p className="subtitle">Strategic Intelligence</p>
        </header>
        <div className="cards-grid">
            {MEMORY_ENTRIES.map(entry => (
                <div key={entry.id} className="mem-card glass-panel">
                    <div className="mem-tag">{entry.tag}</div>
                    <p>{entry.content}</p>
                    <div className="mem-meta">Added by {entry.addedBy} • {entry.addedWhen}</div>
                </div>
            ))}
        </div>
    </section>
);
