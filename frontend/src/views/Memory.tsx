import React from 'react';
import { MEMORY_ENTRIES } from '../data';

export const Memory: React.FC = () => (
  <section className="space-y-6">
    <header>
      <h2 className="text-2xl font-semibold text-white">Memory</h2>
      <p className="mt-1 text-sm text-[#A7ACBF]">Persistent context used to steer brand voice and system behavior.</p>
    </header>

    <div className="grid gap-4 lg:grid-cols-2">
      {MEMORY_ENTRIES.map(entry => (
        <article
          key={entry.id}
          className="rounded-xl border border-white/10 bg-[#0B0E16]/80 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm"
        >
          <span className="inline-flex rounded-full border border-[#4F46E5]/40 bg-[#4F46E5]/15 px-2.5 py-1 text-xs font-medium text-[#D6D3FF]">
            {entry.tag}
          </span>
          <p className="mt-3 text-sm leading-relaxed text-[#F4F6FF]">{entry.content}</p>
          <p className="mt-4 text-xs text-[#A7ACBF]">
            Added by {entry.addedBy} | {entry.addedWhen}
          </p>
        </article>
      ))}
    </div>
  </section>
);
