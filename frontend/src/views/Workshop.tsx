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
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Workshop</h2>
        <p className="mt-1 text-sm text-[#A7ACBF]">Kanban task system with drag-and-drop across lanes.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {columns.map(col => (
          <article
            key={col.id}
            className="rounded-xl border border-white/10 bg-[#0B0E16]/80 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm"
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{col.label}</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-[#A7ACBF]">
                {col.cards.length}
              </span>
            </div>

            <div className="space-y-3">
              {col.cards.map((card, i) => (
                <div
                  key={`${col.id}-${i}`}
                  className="cursor-grab rounded-lg border border-white/10 bg-[#05060B]/80 p-3 transition-colors hover:border-white/20 active:cursor-grabbing"
                  draggable
                  onDragStart={() => handleDragStart(card, col.id)}
                >
                  <p className="text-sm font-medium text-[#F4F6FF]">{card.title}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="rounded-full bg-[#4F46E5]/20 px-2 py-1 text-[#D6D3FF]">{card.agent}</span>
                    <span className="text-[#A7ACBF]">Priority</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
