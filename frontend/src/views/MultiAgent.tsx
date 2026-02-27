import React from 'react';

export const MultiAgent: React.FC = () => (
  <section className="space-y-6">
    <header>
      <h2 className="text-2xl font-semibold text-white">Multi-Agent</h2>
      <p className="mt-1 text-sm text-[#A7ACBF]">High-level orchestration graph for active agents.</p>
    </header>

    <div className="relative h-[420px] overflow-hidden rounded-xl border border-white/10 bg-[#0B0E16]/80 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className="absolute left-1/2 top-[16%] z-10 -translate-x-1/2 rounded-full border border-[#4F46E5]/40 bg-[#4F46E5]/20 px-4 py-2 text-sm font-semibold text-[#E0DDFF]">
        Orchestrator
      </div>
      <div className="absolute left-[23%] top-[58%] z-10 -translate-x-1/2 rounded-full border border-white/20 bg-[#05060B]/80 px-4 py-2 text-sm text-[#F4F6FF]">
        Research Agent
      </div>
      <div className="absolute left-[77%] top-[58%] z-10 -translate-x-1/2 rounded-full border border-white/20 bg-[#05060B]/80 px-4 py-2 text-sm text-[#F4F6FF]">
        Writer Agent
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(99,102,241,0.7)" />
          </marker>
        </defs>
        <line
          x1="50"
          y1="24"
          x2="25"
          y2="56"
          stroke="rgba(99,102,241,0.65)"
          strokeWidth="0.5"
          strokeDasharray="2,1.4"
          markerEnd="url(#arrow)"
        />
        <line x1="50" y1="24" x2="75" y2="56" stroke="rgba(99,102,241,0.65)" strokeWidth="0.5" markerEnd="url(#arrow)" />
      </svg>

      <p className="absolute bottom-4 left-4 text-xs text-[#A7ACBF]">
        Arrows indicate delegated tasks and completion feedback loops.
      </p>
    </div>
  </section>
);
