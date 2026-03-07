import { Link } from 'react-router-dom';
import { Bot, Terminal, Shield, Activity, ArrowRight, Code, Settings, Search } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="eyebrow text-brand mb-4 block">About</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Built by engineers
            <br />
            <span className="text-gradient">who ran agents in production.</span>
          </h1>
          <p className="text-[#A7ACBF] text-lg max-w-2xl mx-auto">
            We shipped AI agents to real users and had no idea what they were doing at 3am. Jarvis
            is the dashboard we wish we had.
          </p>
        </div>
      </section>

      {/* The problem */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="eyebrow text-brand mb-4 block">The problem</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                AI agents are powerful. And completely invisible.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-6">
                When we started running AI agents in production — code agents, research agents,
                ops agents — we had no idea what they were doing between runs. Were they working?
                Stuck? Spending money? We only found out when something broke.
              </p>
              <p className="text-[#A7ACBF] text-lg mb-6">
                We watched an agent rack up $400 in API costs overnight. We had a research agent
                silently fail for three days. We had an ops agent delete a staging database because
                there was no approval gate in place.
              </p>
              <p className="text-[#A7ACBF] text-lg">
                Each time, we thought: there should be a single place to see everything, stop
                anything, and approve the actions that matter. So we built it.
              </p>
            </div>

            {/* Agent illustrations */}
            <div className="space-y-4">
              {[
                { icon: Terminal, name: 'code-agent', event: 'tool_call', msg: 'write_file /src/auth.ts — $0.004', color: 'text-brand', bg: 'bg-brand/10' },
                { icon: Search,   name: 'research-agent', event: 'completion', msg: 'Analysis complete — $0.018', color: 'text-green-400', bg: 'bg-green-400/10' },
                { icon: Settings, name: 'ops-agent', event: 'approval_request', msg: 'Deploy to production?', color: 'text-orange-400', bg: 'bg-orange-400/10' },
              ].map((item) => (
                <div key={item.name} className="data-card p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-sm text-white">{item.name}</span>
                      <span className={`text-xs ${item.color}`}>{item.event}</span>
                    </div>
                    <p className="text-xs text-[#A7ACBF] truncate">{item.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="eyebrow text-brand mb-4 block">Mission</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Every AI agent deserves a mission control.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Activity,
                title: 'Full visibility',
                desc: 'Every event your agent generates should be visible in real time — not buried in logs, not lost in stdout. Jarvis gives you a live feed of every action, cost, and status change.',
              },
              {
                icon: Shield,
                title: 'Meaningful control',
                desc: 'Pausing, unpausing, revoking access, approving critical actions — these should take one click, not a deployment. Jarvis puts every control exactly where you need it.',
              },
              {
                icon: Bot,
                title: 'Universal compatibility',
                desc: 'Claude Code, Codex, OpenAI Agents, n8n, Make, custom Python scripts — it does not matter how your agents are built. If they can make an HTTP request, they can connect to Jarvis.',
              },
            ].map((item) => (
              <div key={item.title} className="data-card p-8">
                <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-[#A7ACBF]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="eyebrow text-brand mb-4 block">Technology</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Built on infrastructure you can trust.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                Jarvis is built on Supabase for the backend, React for the dashboard, and Python
                for the SDKs. The MCP server uses the official{' '}
                <code className="text-brand bg-white/5 px-1.5 rounded">mcp</code> Python
                library for standards-compliant tool exposure to any MCP-compatible agent.
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Backend', value: 'Supabase (PostgreSQL + Auth + RLS + Realtime)' },
                  { label: 'Dashboard', value: 'React 19 + Vite + Tailwind CSS' },
                  { label: 'MCP server', value: 'Python + mcp library + httpx' },
                  { label: 'Python SDK', value: 'jarvis-mc (pip install jarvis-mc)' },
                  { label: 'Hosting', value: 'Vercel (frontend) + Supabase (database + auth)' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 py-2 border-b border-white/5">
                    <span className="text-sm text-[#A7ACBF] w-28 shrink-0">{item.label}</span>
                    <span className="text-sm font-mono text-[#F4F6FF]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="data-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">JARVIS</p>
                  <p className="text-xs text-[#A7ACBF]">Mission Control</p>
                </div>
              </div>
              <p className="text-[#A7ACBF] mb-6">
                We're in private beta. We're talking to early teams, shipping fast, and iterating
                on real feedback. If you're running AI agents and want full visibility into what
                they're doing, we want to hear from you.
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/auth" className="btn-primary flex items-center justify-center gap-2">
                  Request access <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/contact" className="btn-secondary flex items-center justify-center gap-2">
                  Get in touch
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How we build.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: 'Accuracy over polish',
                desc: 'We only show numbers we trust. If an event does not have a cost, we show $0.00, not a blank. If an agent has not been seen, we show the exact timestamp.',
              },
              {
                title: 'Simple over clever',
                desc: 'One button to approve. One button to pause. One button to revoke. We resist the temptation to add configuration when defaults work.',
              },
              {
                title: 'Security by default',
                desc: 'Token hashing, RLS, immutable logs — these are not features you opt into. They are the baseline. We do not ship without them.',
              },
              {
                title: 'Agent-first design',
                desc: 'The API is designed for agents, not for humans writing curl commands. Every endpoint is lean, authenticated, and clearly documented.',
              },
            ].map((item) => (
              <div key={item.title} className="data-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Code className="w-4 h-4 text-brand" />
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="text-sm text-[#A7ACBF]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
