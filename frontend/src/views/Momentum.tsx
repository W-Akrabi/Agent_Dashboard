import React from 'react';
import { MOMENTUM_TASKS } from '../data';

const priorityStyles: Record<string, string> = {
  Critical: 'border-red-400/40 bg-red-400/15 text-red-200',
  High: 'border-amber-400/40 bg-amber-400/15 text-amber-200',
  Medium: 'border-blue-400/40 bg-blue-400/15 text-blue-200',
};

export const Momentum: React.FC = () => (
  <section className="space-y-6">
    <header>
      <h2 className="text-2xl font-semibold text-white">Momentum</h2>
      <p className="mt-1 text-sm text-[#A7ACBF]">Ranked work queue based on urgency, risk, and downstream impact.</p>
    </header>

    <div className="space-y-3 rounded-xl border border-white/10 bg-[#0B0E16]/80 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      {MOMENTUM_TASKS.map(task => (
        <article
          key={task.rank}
          className="grid gap-3 rounded-lg border border-white/10 bg-[#05060B]/70 p-4 md:grid-cols-[56px_1fr_auto] md:items-center"
        >
          <div className="text-xl font-bold text-[#A7ACBF]">#{task.rank}</div>
          <div>
            <h3 className="text-sm font-semibold text-[#F4F6FF]">{task.title}</h3>
            <p className="mt-1 text-sm text-[#A7ACBF]">Reason: {task.reason}</p>
          </div>
          <div
            className={`inline-flex h-fit w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
              priorityStyles[task.priority] ?? priorityStyles.Medium
            }`}
          >
            {task.priority}
          </div>
        </article>
      ))}
    </div>
  </section>
);
