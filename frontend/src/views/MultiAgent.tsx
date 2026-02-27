import React from 'react';

export const MultiAgent: React.FC = () => (
    <section id="multi-agent" className="view-section active">
        <header className="section-header">
            <h1>Multi-Agent</h1>
            <p className="subtitle">Agent Architecture Graph</p>
        </header>
        <div className="content glass-panel graph-container" id="agent-graph">
            <div className="node orchestrator" style={{ top: '20%', left: '40%' }}>Orchestrator</div>
            <div className="node worker" style={{ top: '60%', left: '20%' }}>Research Agent</div>
            <div className="node worker" style={{ top: '60%', left: '60%' }}>Writer Agent</div>
            <svg className="graph-edges" width="100%" height="100%"
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                <defs>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="rgba(99,102,241,0.6)" />
                    </marker>
                </defs>
                <line x1="45%" y1="28%" x2="25%" y2="55%" stroke="rgba(99,102,241,0.5)" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrow)" />
                <line x1="48%" y1="28%" x2="65%" y2="55%" stroke="rgba(99,102,241,0.5)" strokeWidth="2" markerEnd="url(#arrow)" />
            </svg>
        </div>
    </section>
);
