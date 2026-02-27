import React, { useState } from 'react';
import { SCHEDULER_JOBS } from '../data';

export const Scheduler: React.FC = () => {
  const [jobs, setJobs] = useState(SCHEDULER_JOBS);

  const toggle = (id: string) => setJobs(js => js.map(j => (j.id === id ? { ...j, enabled: !j.enabled } : j)));

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Scheduler</h2>
        <p className="mt-1 text-sm text-[#A7ACBF]">Cron jobs that trigger orchestration and automated routines.</p>
      </header>

      <div className="space-y-3 rounded-xl border border-white/10 bg-[#0B0E16]/80 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        {jobs.map(job => (
          <article
            key={job.id}
            className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#05060B]/70 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h3 className="text-sm font-semibold text-[#F4F6FF]">{job.name}</h3>
              <p className="mt-1 text-xs text-[#A7ACBF]">Webhook: {job.webhook}</p>
              <p className="mt-2 text-xs text-[#A7ACBF]">
                Next run: <span className="text-[#F4F6FF]">{job.nextRun}</span> | cron:{' '}
                <code className="rounded bg-black/30 px-1.5 py-0.5 text-[11px] text-[#D6D3FF]">{job.cron}</code>
              </p>
            </div>

            <label className="relative inline-flex h-7 w-12 cursor-pointer items-center self-start md:self-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={job.enabled}
                onChange={() => toggle(job.id)}
                aria-label={`Toggle ${job.name}`}
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
