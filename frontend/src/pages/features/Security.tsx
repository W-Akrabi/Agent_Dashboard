import { Link } from 'react-router-dom';
import { Lock, Shield, Activity, Key, UserCheck, Database, ArrowRight, CheckCircle } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

export default function SecurityPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="eyebrow text-brand mb-4 block">Security</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Secure by default,
                <br />
                <span className="text-gradient">not by configuration.</span>
              </h1>
              <p className="text-[#A7ACBF] text-lg mb-10">
                Agent tokens are hashed before storage. Dashboard sessions use JWT authentication.
                Workspace isolation is enforced at the database layer with Row-Level Security.
                No config required — it's all on by default.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
                  Get started <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/contact" className="btn-secondary">
                  Talk to security
                </Link>
              </div>
            </div>

            {/* Security cards */}
            <div className="space-y-4">
              {[
                {
                  icon: Lock,
                  title: 'SHA-256 hashed agent tokens',
                  desc: 'Tokens are shown once at creation and never stored in plaintext. Only the SHA-256 hash is persisted — a leak of the database reveals nothing usable.',
                },
                {
                  icon: Shield,
                  title: 'Workspace isolation via RLS',
                  desc: "Supabase Row-Level Security enforces tenant boundaries at the database layer. No query from workspace A can ever read or modify workspace B's data.",
                },
                {
                  icon: Activity,
                  title: 'Immutable event log',
                  desc: 'Every action, cost, and approval decision is recorded and cannot be modified or deleted. Your audit trail is always complete.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-5 rounded-xl border border-white/5 bg-white/[0.02]"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">{item.title}</p>
                    <p className="text-sm text-[#A7ACBF]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Deep dive */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="eyebrow text-brand mb-4 block">Details</span>
            <h2 className="text-3xl md:text-4xl font-bold">Every layer, explained.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Key,
                title: 'Agent token lifecycle',
                points: [
                  'Generated as a cryptographically random string at registration',
                  'Shown once — plaintext is never stored',
                  'SHA-256 hash stored in the database',
                  'One active token per agent at any time',
                  'Revoke and regenerate from the agent detail page',
                ],
              },
              {
                icon: UserCheck,
                title: 'Dashboard authentication',
                points: [
                  'Supabase Auth handles email/password and OAuth',
                  'JWTs signed with RS256 / HS256',
                  'Sessions expire and refresh automatically',
                  'All API routes validate the session token server-side',
                  'No sensitive data served to unauthenticated requests',
                ],
              },
              {
                icon: Database,
                title: 'Data isolation (RLS)',
                points: [
                  'Every row in agents, events, and commands tables is workspace-scoped',
                  'PostgreSQL Row-Level Security policies enforced at query time',
                  'Cross-tenant reads are impossible, not just unlikely',
                  'Service role key never exposed to the browser',
                  'No shared tables or global state between workspaces',
                ],
              },
              {
                icon: Shield,
                title: 'Agent API security',
                points: [
                  'Every agent request authenticated by X-Agent-Token header',
                  'Token lookup resolves to a specific workspace and agent',
                  'Agents can only write events; they cannot read other events',
                  'Rate limiting applied per token',
                  'Paused agents cannot post new events',
                ],
              },
              {
                icon: Activity,
                title: 'Audit and compliance',
                points: [
                  'Every event stored with created_at timestamp and agent ID',
                  'Approval decisions stored with decision, comment, and timestamp',
                  'Event log is append-only; no update or delete APIs exposed',
                  'Full event history accessible from the agent detail page',
                  'Exportable on Enterprise plan',
                ],
              },
              {
                icon: Lock,
                title: 'Infrastructure security',
                points: [
                  'Hosted on Supabase (SOC 2 Type II)',
                  'TLS 1.2+ enforced on all connections',
                  'Secrets managed via environment variables — never in code',
                  'No third-party analytics or tracking on agent traffic',
                  'On-prem deployment available on Enterprise plan',
                ],
              },
            ].map((item) => (
              <div key={item.title} className="data-card p-6">
                <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold mb-3">{item.title}</h3>
                <ul className="space-y-2">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      <span className="text-[#A7ACBF]">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Security FAQ</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: 'Can I rotate my agent token without losing history?',
                a: 'Yes. Revoking a token invalidates it immediately and deletes it from the system, but all events logged under that agent are preserved. You then generate a new token from the agent detail page.',
              },
              {
                q: 'Is the plaintext token ever stored anywhere?',
                a: 'No. The plaintext token is generated in memory, shown once in the UI, and immediately discarded. Only the SHA-256 hash is written to the database. If you lose the token you must revoke it and generate a new one.',
              },
              {
                q: 'Can one workspace access another workspace\'s agents or events?',
                a: 'No. Row-Level Security policies at the PostgreSQL level enforce strict workspace isolation. Every query is automatically filtered by the authenticated user\'s workspace — there is no application-level bypass.',
              },
              {
                q: 'What happens to events if an agent token is revoked?',
                a: 'All previously logged events remain in the system under the agent record. Only new API requests using the revoked token are rejected. Historical data is always preserved.',
              },
              {
                q: 'Do you offer SSO or SCIM for enterprise teams?',
                a: 'SSO and audit log export are available on the Enterprise plan. Contact sales to discuss your specific requirements.',
              },
            ].map((item) => (
              <div key={item.q} className="data-card p-6">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-[#A7ACBF]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Questions about security?</h2>
          <p className="text-[#A7ACBF] text-lg mb-10">
            We're happy to walk through our security model, answer a security questionnaire, or
            discuss enterprise requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="btn-primary">
              Contact Security Team
            </Link>
            <Link to="/auth" className="btn-secondary">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
