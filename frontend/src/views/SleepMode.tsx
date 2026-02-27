import React, { useState } from 'react';
import { AUTOMATION_RULES } from '../data';

export const SleepMode: React.FC = () => {
  const [rules, setRules] = useState(AUTOMATION_RULES);
  const toggle = (id: string) => setRules(rs => rs.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Sleep Mode</h2>
        <p className="mt-1 text-sm text-[#A7ACBF]">Automation rules that protect spend and reduce off-hours noise.</p>
      </header>

      <div className="space-y-3 rounded-xl border border-white/10 bg-[#0B0E16]/80 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        {rules.map(rule => (
          <article
            key={rule.id}
            className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#05060B]/70 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-[#A7ACBF]">
                IF <span className="text-[#F4F6FF]">{rule.condition}</span>
              </p>
              <p className="text-xs font-semibold tracking-wide text-[#A7ACBF]">
                THEN <span className="text-[#D6D3FF]">{rule.action}</span>
              </p>
            </div>

            <label className="relative inline-flex h-7 w-12 cursor-pointer items-center self-start md:self-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={rule.enabled}
                onChange={() => toggle(rule.id)}
                aria-label={`Toggle rule ${rule.id}`}
              />
              <span className="absolute inset-0 rounded-full bg-white/15 transition-colors peer-checked:bg-[#4F46E5]" />
              <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
};
