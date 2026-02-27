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
  <section className="space-y-6">
    <header>
      <h2 className="text-2xl font-semibold text-white">The Glue</h2>
      <p className="mt-1 text-sm text-[#A7ACBF]">Ingest API documentation for agent telemetry and control handoff.</p>
    </header>

    <article className="rounded-xl border border-white/10 bg-[#0B0E16]/80 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full border border-emerald-400/35 bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
          POST
        </span>
        <code className="rounded bg-black/35 px-2 py-1 text-sm text-[#D6D3FF]">/api/ingest</code>
      </div>
      <p className="mb-4 text-sm text-[#A7ACBF]">
        The single endpoint every agent uses to report status, spend, and request next actions.
      </p>
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#05060B]/80 p-4 text-xs leading-6 text-[#C7CCDD]">
        <code>{CODE}</code>
      </pre>
    </article>
  </section>
);
