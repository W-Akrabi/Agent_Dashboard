import { Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  Bot,
  Shield,
  Clock,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

export default function ApprovalsPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <span className="eyebrow text-brand mb-4 block">Approvals</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Your agent pauses.
              <br />
              <span className="text-gradient">You decide. It continues.</span>
            </h1>
            <p className="text-[#A7ACBF] text-lg mb-10">
              Gate any sensitive action behind human review. The agent halts mid-task, your inbox
              shows exactly what it has done and what it wants to do next, and your decision is
              delivered back instantly via polling — no webhook needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
                Open the inbox <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/docs" className="btn-secondary">
                Read the docs
              </Link>
            </div>
          </div>

          {/* Demo approval card */}
          <div className="max-w-md mx-auto">
            <div className="data-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="font-medium font-mono">ops-agent</p>
                  <p className="text-xs text-orange-400">waiting_approval</p>
                </div>
              </div>

              <p className="text-xs text-[#A7ACBF] uppercase tracking-widest mb-3">Completed</p>
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-[#A7ACBF]">Fetched 312 subscriber records</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-[#A7ACBF]">Validated all email addresses</span>
                </div>
              </div>

              <p className="text-xs text-[#A7ACBF] uppercase tracking-widest mb-3">
                Proposed next action
              </p>
              <div className="flex items-start gap-2 mb-6 p-3 rounded-lg border border-brand/30 bg-brand/5">
                <ArrowRight className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <span className="text-sm">Send marketing email to 312 recipients</span>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works step by step */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="eyebrow text-brand mb-4 block">How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold">Four steps. Zero webhooks.</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                step: '01',
                title: 'Agent requests approval',
                desc: 'The agent calls request_approval with a message describing what it has done and what it wants to do next. This creates an event with requiresApproval: true and sets the agent status to waiting_approval.',
                code: `request_approval(
  message="Fetched 312 subscribers, validated emails",
  proposed_action="Send marketing email to all 312 recipients"
)`,
              },
              {
                step: '02',
                title: 'Request appears in your inbox',
                desc: "Jarvis routes it to your dashboard inbox immediately. You see the agent name, status, completed actions, and the proposed next step — everything you need to make a decision.",
              },
              {
                step: '03',
                title: 'You approve or reject',
                desc: "Click Approve or Reject. You can add an optional comment to explain your decision. The decision is stored as a pending command tied to the agent.",
              },
              {
                step: '04',
                title: 'Agent receives the decision',
                desc: "The agent is polling GET /v1/commands every 3 seconds. When a decision arrives, it acknowledges the command and continues (or aborts). No webhook, no ngrok, no open port needed.",
                code: `# Decision returned to the agent
"Decision: approved. Comment: LGTM, looks good."`,
              },
            ].map((item) => (
              <div key={item.step} className="data-card p-6">
                <div className="flex gap-4">
                  <span className="text-3xl font-bold text-brand/30 font-mono shrink-0 w-10">
                    {item.step}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-[#A7ACBF] text-sm mb-3">{item.desc}</p>
                    {item.code && (
                      <pre className="text-xs font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-3 overflow-x-auto whitespace-pre">
                        {item.code}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Built for actions that can't be undone.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Shield,
                title: 'Gate destructive actions',
                desc: 'Deploying to production, deleting records, sending emails, making purchases — require approval for anything irreversible.',
              },
              {
                icon: MessageSquare,
                title: 'Optional comments',
                desc: 'Add context to your decision. The comment is delivered back to the agent so it can adapt its next steps accordingly.',
              },
              {
                icon: Clock,
                title: 'Configurable timeout',
                desc: 'Set a timeout_minutes value. If no decision arrives in time, the agent treats it as rejected and aborts safely.',
              },
              {
                icon: Bot,
                title: 'Visible agent context',
                desc: 'The inbox shows completed_actions alongside the proposed_action, so you always have full context before deciding.',
              },
              {
                icon: Zap,
                title: 'No infrastructure needed',
                desc: 'Decision delivery uses command polling over HTTPS. Your agent needs no open port, no webhook, no public IP.',
              },
              {
                icon: CheckCircle,
                title: 'Full audit trail',
                desc: 'Every approval and rejection is stored with agent ID, timestamp, decision, and comment. Immutable and always accessible.',
              },
            ].map((item) => (
              <div key={item.title} className="data-card p-6">
                <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[#A7ACBF]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Put a human in the loop today.
          </h2>
          <p className="text-[#A7ACBF] text-lg mb-10">
            One tool call. Full control over every critical action your agents take.
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
