import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Bell, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

export default function SpendControlPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="eyebrow text-[#4F46E5] mb-4 block">Spend Control</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Know exactly what
                <br />
                <span className="text-gradient">your agents cost.</span>
              </h1>
              <p className="text-[#A7ACBF] text-lg mb-10">
                Every event carries a dollar cost. Jarvis aggregates it into daily and monthly
                totals, breaks it down per agent, and measures it against a budget cap you control.
                No more surprise AI bills.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
                  View spend dashboard <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/pricing" className="btn-secondary">
                  See pricing
                </Link>
              </div>
            </div>

            {/* Budget card */}
            <div className="data-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Monthly Budget</span>
                <span className="text-sm text-[#A7ACBF]">$843 / $1,000</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                  style={{ width: '84%' }}
                />
              </div>
              <p className="text-xs text-orange-400">84% used — approaching your monthly cap</p>

              <div className="pt-2 space-y-3 border-t border-white/5">
                <p className="text-xs text-[#A7ACBF] uppercase tracking-widest pt-1">
                  Per-agent breakdown
                </p>
                {[
                  { name: 'writer-agent', spend: 312.4, pct: 37 },
                  { name: 'research-agent', spend: 287.6, pct: 34 },
                  { name: 'ops-agent', spend: 243.0, pct: 29 },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#A7ACBF] font-mono">{item.name}</span>
                      <span className="text-sm font-mono">${item.spend.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4F46E5]/60 rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#A7ACBF] mb-1">Today</p>
                  <p className="text-xl font-bold font-mono">$42.80</p>
                </div>
                <div>
                  <p className="text-xs text-[#A7ACBF] mb-1">This month</p>
                  <p className="text-xl font-bold font-mono">$843.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="eyebrow text-[#4F46E5] mb-4 block">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to stay on budget.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: DollarSign,
                title: 'Per-event cost tracking',
                desc: 'Pass a cost field with every event. Jarvis stores it against the event and rolls it up automatically — no separate billing integration needed.',
                features: [
                  'Attach cost to any event type',
                  'Dollar or cent precision',
                  'Retroactive historical totals',
                ],
              },
              {
                icon: BarChart3,
                title: 'Daily and monthly aggregation',
                desc: 'The spend dashboard shows today\'s burn rate alongside your monthly total. Drill into any agent to see its individual cost history.',
                features: [
                  'Running daily total on the main dashboard',
                  'Monthly total versus your set cap',
                  'Per-agent cost on agent detail page',
                ],
              },
              {
                icon: TrendingUp,
                title: 'Editable budget cap',
                desc: 'Set a monthly dollar limit from the spend page. Edit it any time. Jarvis measures spend against it in real time and changes the progress bar colour as you approach the limit.',
                features: [
                  'Progress bar: green → orange at 80% → red at 100%',
                  'Edit the cap at any time without losing history',
                  'Cap visible on the main dashboard widget',
                ],
              },
              {
                icon: Bell,
                title: 'Visual alerts at thresholds',
                desc: 'No need to set up email alerts — the dashboard makes over-budget impossible to miss. The progress bar turns orange at 80% and red when you\'re over.',
                features: [
                  'Colour-coded bar changes automatically',
                  'Warning text displayed below the bar',
                  'Spend card on dashboard always visible',
                ],
              },
            ].map((item) => (
              <div key={item.title} className="data-card p-6">
                <div className="w-10 h-10 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[#A7ACBF] mb-4">{item.desc}</p>
                <ul className="space-y-2">
                  {item.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-[#4F46E5] shrink-0" />
                      <span className="text-[#A7ACBF]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to log cost */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <span className="eyebrow text-[#4F46E5] mb-4 block">Integration</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Log cost in three ways.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                Pass a <code className="text-[#4F46E5] bg-white/5 px-1.5 rounded">cost</code> field
                with any event. If you don't include it, it defaults to{' '}
                <code className="text-[#4F46E5] bg-white/5 px-1.5 rounded">0</code>. You can use
                whatever unit makes sense — just stay consistent across your agents.
              </p>
              <ul className="space-y-4">
                {[
                  'Works with any LLM — OpenAI, Anthropic, Gemini, or open-source models',
                  'Compute costs, API fees, third-party service charges — log anything with a dollar value',
                  'Zero cost events still tracked; cost field is always optional',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[#A7ACBF]">
                    <CheckCircle className="w-5 h-5 text-[#4F46E5] shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="data-card p-6">
                <p className="text-xs text-[#A7ACBF] uppercase tracking-widest mb-3">
                  MCP (Claude Code / Codex)
                </p>
                <pre className="text-xs font-mono text-[#F4F6FF] overflow-x-auto whitespace-pre">{`log_action(
  message="Called GPT-4o for classification",
  type="tool_call",
  cost=0.0085   # USD
)`}</pre>
              </div>
              <div className="data-card p-6">
                <p className="text-xs text-[#A7ACBF] uppercase tracking-widest mb-3">
                  Python SDK
                </p>
                <pre className="text-xs font-mono text-[#F4F6FF] overflow-x-auto whitespace-pre">{`agent.log(
    "Called GPT-4o for classification",
    type="tool_call",
    cost=0.0085
)`}</pre>
              </div>
              <div className="data-card p-6">
                <p className="text-xs text-[#A7ACBF] uppercase tracking-widest mb-3">
                  Direct HTTP
                </p>
                <pre className="text-xs font-mono text-[#F4F6FF] overflow-x-auto whitespace-pre">{`POST /v1/events
{
  "type": "tool_call",
  "message": "Called GPT-4o",
  "cost": 0.0085
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Never be surprised by an AI bill again.
          </h2>
          <p className="text-[#A7ACBF] text-lg mb-10">
            Set a budget cap, log your costs, and watch the dashboard so you always know where you
            stand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth" className="btn-primary">
              Get Started Free
            </Link>
            <Link to="/pricing" className="btn-secondary">
              See Pricing
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
