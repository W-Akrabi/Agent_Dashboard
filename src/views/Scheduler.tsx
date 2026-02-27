import React, { useState } from 'react';
import { SCHEDULER_JOBS } from '../data';

export const Scheduler: React.FC = () => {
    const [jobs, setJobs] = useState(SCHEDULER_JOBS);

    const toggle = (id: string) =>
        setJobs(js => js.map(j => j.id === id ? { ...j, enabled: !j.enabled } : j));

    return (
        <section id="scheduler" className="view-section active">
            <header className="section-header">
                <h1>Scheduler</h1>
                <p className="subtitle">Cron Jobs</p>
            </header>
            <div className="content glass-panel">
                <div className="job-list">
                    {jobs.map(job => (
                        <div key={job.id} className="job-item">
                            <div className="job-info">
                                <h4>{job.name}</h4>
                                <p>webhook: {job.webhook}</p>
                                <div className="job-meta">Next run: {job.nextRun} • cron: {job.cron}</div>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={job.enabled} onChange={() => toggle(job.id)} />
                                <span className="slider" />
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
