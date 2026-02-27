import React from 'react';
import { MOMENTUM_TASKS } from '../data';

export const Momentum: React.FC = () => (
    <section id="momentum" className="view-section active">
        <header className="section-header">
            <h1>Momentum</h1>
            <p className="subtitle">Task Ranking Engine</p>
        </header>
        <div className="content glass-panel">
            <div className="momentum-list">
                {MOMENTUM_TASKS.map(task => (
                    <div key={task.rank} className="m-task-item">
                        <div className="m-rank">#{task.rank}</div>
                        <div className="m-content">
                            <div className="m-title">{task.title}</div>
                            <div className="m-reason">Reason: {task.reason}</div>
                        </div>
                        <div className={`m-priority ${task.priorityClass}`}>{task.priority}</div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);
