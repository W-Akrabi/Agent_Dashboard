import React, { useState } from 'react';
import { KANBAN_COLUMNS } from '../data';
import type { KanbanColumn, KanbanCard } from '../types';

export const Workshop: React.FC = () => {
    const [columns, setColumns] = useState<KanbanColumn[]>(KANBAN_COLUMNS);
    const [dragging, setDragging] = useState<{ card: KanbanCard; fromCol: string } | null>(null);

    const handleDragStart = (card: KanbanCard, fromCol: string) => setDragging({ card, fromCol });

    const handleDrop = (toColId: string) => {
        if (!dragging || dragging.fromCol === toColId) return;
        setColumns(cols =>
            cols.map(col => {
                if (col.id === dragging.fromCol) return { ...col, cards: col.cards.filter(c => c !== dragging.card) };
                if (col.id === toColId) return { ...col, cards: [...col.cards, dragging.card] };
                return col;
            })
        );
        setDragging(null);
    };

    return (
        <section id="workshop" className="view-section active">
            <header className="section-header">
                <h1>Workshop</h1>
                <p className="subtitle">Kanban Task System</p>
            </header>
            <div className="kanban-board">
                {columns.map(col => (
                    <div
                        key={col.id}
                        className="kanban-column glass-panel"
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleDrop(col.id)}
                    >
                        <h3>{col.label} <span className="col-count">{col.cards.length}</span></h3>
                        <div className="kanban-cards">
                            {col.cards.map((card, i) => (
                                <div
                                    key={i}
                                    className="k-card"
                                    draggable
                                    onDragStart={() => handleDragStart(card, col.id)}
                                >
                                    <div className="k-card-title">{card.title}</div>
                                    <div className="k-card-meta">
                                        <span className="tag">{card.agent}</span>
                                        <span>High</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
