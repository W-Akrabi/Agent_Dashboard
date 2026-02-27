import React from 'react';

const FIX_ITEMS = [
  {
    id: 'checkout',
    preview: 'Checkout UI Preview',
    title: 'Checkout Form Alignment',
    issue: 'The submit button is overlapping the terms checkbox on mobile layout.',
  },
  {
    id: 'nav',
    preview: 'Navigation Preview',
    title: 'Mobile Nav Overflow',
    issue: 'Nav items are overflowing on viewport widths below 375px.',
  },
];

export const FixUI: React.FC = () => (
  <section className="space-y-6">
    <header>
      <h2 className="text-2xl font-semibold text-white">Fix UI</h2>
      <p className="mt-1 text-sm text-[#A7ACBF]">Screenshot-driven bug triage and patch approval workflow.</p>
    </header>

    <div className="grid gap-4 lg:grid-cols-2">
      {FIX_ITEMS.map(item => (
        <article
          key={item.id}
          className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0E16]/80 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm"
        >
          <div className="flex h-36 items-center justify-center border-b border-white/10 bg-gradient-to-br from-[#4F46E5]/30 via-[#1A1E35] to-[#0B0E16] text-sm font-medium text-[#D6D3FF]">
            {item.preview}
          </div>
          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-sm font-semibold text-[#F4F6FF]">{item.title}</h3>
              <p className="mt-2 text-sm text-[#A7ACBF]">{item.issue}</p>
            </div>
            <div className="flex gap-2">
              <button className="h-10 rounded-lg border border-white/20 px-4 text-sm font-medium text-[#F4F6FF] transition-colors hover:bg-white/5">
                View Diffs
              </button>
              <button className="h-10 rounded-lg bg-[#4F46E5] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5B52EC]">
                Approve Fix
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);
