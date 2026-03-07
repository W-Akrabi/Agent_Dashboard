import { Link } from 'react-router-dom';
import {
  Activity,
  Terminal,
  CheckCircle,
  AlertCircle,
  Inbox,
  DollarSign,
  ArrowRight,
  Zap,
  Eye,
  Clock,
} from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';
import DisplayCards from '@/components/ui/display-cards';

const eventTypes = [
  {
    type: 'action',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    icon: Activity,
    description:
      'A significant step or milestone the agent wants to report. Use this for narrating progress at key points.',
  },
  {
    type: 'tool_call',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
    icon: Terminal,
    description:
      'A specific tool invocation — write_file, bash, web_search, etc. Logged with cost so you know what each tool actually costs.',
  },
  {
    type: 'completion',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
    icon: CheckCircle,
    description:
      'The agent finished a task or sub-task successfully. Useful for marking milestones in long-running operations.',
  },
  {
    type: 'error',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    icon: AlertCircle,
    description:
      'Something went wrong. Surfaces immediately in the live feed with red highlighting so you can act fast.',
  },
  {
    type: 'approval_request',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
    icon: Inbox,
    description:
      'The agent needs a human decision before proceeding. Moves the agent to waiting_approval status and routes it to your inbox.',
  },
];

export default function LiveActivityPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <span className="eyebrow text-brand mb-4 block">Live Activity</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Every action. Every cost.
              <br />
              <span className="text-gradient">In real time.</span>
            </h1>
            <p className="text-[#A7ACBF] text-lg mb-10">
              Agents push events as they run. The live feed shows every tool call, completion,
              error, and approval request the moment it happens — each tagged with a dollar cost
              so nothing runs blind.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
                See the live feed <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/docs" className="btn-secondary">
                Read the docs
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <DisplayCards
              cards={[
                {
                  icon: <Terminal className="w-4 h-4" />,
                  title: 'tool_call',
                  description: 'code-agent — write_file /src/auth.ts',
                  date: '8 min ago',
                  iconClassName: 'text-brand',
                  titleClassName: 'text-brand',
                },
                {
                  icon: <CheckCircle className="w-4 h-4" />,
                  title: 'completion',
                  description: 'research-agent finished analysis',
                  date: '3 min ago',
                  iconClassName: 'text-green-400',
                  titleClassName: 'text-green-400',
                },
                {
                  icon: <Inbox className="w-4 h-4" />,
                  title: 'approval_request',
                  description: 'ops-agent — deploy to production',
                  date: 'Just now',
                  iconClassName: 'text-orange-400',
                  titleClassName: 'text-orange-400',
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="eyebrow text-brand mb-4 block">Event Types</span>
            <h2 className="text-3xl md:text-4xl font-bold">Five types. One unified feed.</h2>
            <p className="text-[#A7ACBF] mt-4">
              Every event shares the same schema — type, message, cost — so your feed is always
              consistent and easy to filter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {eventTypes.map((event) => (
              <div key={event.type} className={`data-card p-6 border ${event.border}`}>
                <div
                  className={`w-10 h-10 rounded-lg ${event.bg} flex items-center justify-center mb-4`}
                >
                  <event.icon className={`w-5 h-5 ${event.color}`} />
                </div>
                <code className={`text-sm font-mono ${event.color} mb-2 block`}>{event.type}</code>
                <p className="text-sm text-[#A7ACBF]">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <span className="eyebrow text-brand mb-4 block">How it works</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">One POST. Instant visibility.</h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                Your agent calls{' '}
                <code className="text-brand bg-white/5 px-1.5 rounded">POST /v1/events</code>{' '}
                with an{' '}
                <code className="text-brand bg-white/5 px-1.5 rounded">X-Agent-Token</code>{' '}
                header. Jarvis stores the event, updates the agent's{' '}
                <code className="text-brand bg-white/5 px-1.5 rounded">last_seen_at</code> and
                status, aggregates the cost, and streams it live to your dashboard.
              </p>
              <div className="space-y-5">
                {[
                  {
                    icon: Zap,
                    label: 'Sub-second delivery',
                    desc: 'Events appear in the feed within milliseconds of the POST',
                  },
                  {
                    icon: DollarSign,
                    label: 'Cost per event',
                    desc: 'Pass a cost field with every event — aggregated daily and monthly automatically',
                  },
                  {
                    icon: Eye,
                    label: 'Persistent history',
                    desc: 'Full event history stored per agent; browse it on the agent detail page',
                  },
                  {
                    icon: Clock,
                    label: 'Last seen tracking',
                    desc: 'Agent last_seen_at updates on every event so you always know which agents are alive',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-sm text-[#A7ACBF]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="data-card p-6">
                <p className="text-xs text-[#A7ACBF] uppercase tracking-widest mb-3">
                  Direct API
                </p>
                <pre className="text-xs font-mono text-[#F4F6FF] overflow-x-auto leading-relaxed whitespace-pre">{`POST /v1/events
X-Agent-Token: jmc_abc123...

{
  "type": "tool_call",
  "message": "write_file /src/auth.ts",
  "cost": 0.0042
}`}</pre>
              </div>
              <div className="data-card p-6">
                <p className="text-xs text-[#A7ACBF] uppercase tracking-widest mb-3">
                  Via MCP tool (Claude Code / Codex)
                </p>
                <pre className="text-xs font-mono text-[#F4F6FF] overflow-x-auto leading-relaxed whitespace-pre">{`log_action(
  message="Wrote authentication module",
  type="tool_call",
  cost=0.0042
)`}</pre>
              </div>
              <div className="data-card p-6">
                <p className="text-xs text-[#A7ACBF] uppercase tracking-widest mb-3">
                  Python SDK
                </p>
                <pre className="text-xs font-mono text-[#F4F6FF] overflow-x-auto leading-relaxed whitespace-pre">{`from jarvis_mc import JarvisAgent

agent = JarvisAgent(token="...", base_url="...")
agent.log(
    "Wrote authentication module",
    type="tool_call",
    cost=0.0042
)`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start streaming your first event.
          </h2>
          <p className="text-[#A7ACBF] text-lg mb-10">
            Register your agent, copy the token, and your first event appears in the feed within
            seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth" className="btn-primary">
              Get Started Free
            </Link>
            <Link to="/docs" className="btn-secondary">
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
