import React from 'react';

const CODE = `fetch('https://jarvis.mc/api/ingest', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_PROXY_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentId: 'writer-agent-01',
    eventType: 'task_complete',
    message: 'Drafted Q3 review post.',
    proposedNextAction: 'Request human review',
    tokenCount: 4502,
    cost: 0.045
  })
});`;

export const IngestApi: React.FC = () => (
    <section id="ingest-api" className="view-section active">
        <header className="section-header">
            <h1>The Glue</h1>
            <p className="subtitle">Ingest API Documentation</p>
        </header>
        <div className="content code-container glass-panel">
            <h3>POST /api/ingest</h3>
            <p>The single endpoint every agent uses to report status, spend, and request next actions.</p>
            <pre><code>{CODE}</code></pre>
        </div>
    </section>
);
