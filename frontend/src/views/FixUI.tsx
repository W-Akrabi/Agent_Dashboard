import React from 'react';

export const FixUI: React.FC = () => (
    <section id="fix-ui" className="view-section active">
        <header className="section-header">
            <h1>Fix UI</h1>
            <p className="subtitle">Screenshot Workflow</p>
        </header>
        <div className="gallery-container">
            <div className="screenshot-card">
                <div className="img-placeholder">Checkout UI Preview</div>
                <div className="card-body">
                    <h4>Checkout Form Alignment</h4>
                    <p className="issue-text">"The submit button is overlapping the terms checkbox on mobile layout."</p>
                    <div className="actions">
                        <button className="btn-secondary">View Diffs</button>
                        <button className="btn-primary">Approve Fix</button>
                    </div>
                </div>
            </div>
            <div className="screenshot-card">
                <div className="img-placeholder">Navigation Preview</div>
                <div className="card-body">
                    <h4>Mobile Nav Overflow</h4>
                    <p className="issue-text">"Nav items are overflowing on viewport widths below 375px."</p>
                    <div className="actions">
                        <button className="btn-secondary">View Diffs</button>
                        <button className="btn-primary">Approve Fix</button>
                    </div>
                </div>
            </div>
        </div>
    </section>
);
