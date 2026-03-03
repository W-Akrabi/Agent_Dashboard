import { Link } from 'react-router-dom';
import { CheckCircle, X } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For solo developers and small experiments.',
    features: [
      { label: 'Up to 3 agents', included: true },
      { label: '1,000 events/day', included: true },
      { label: 'Live activity feed', included: true },
      { label: 'Basic spend tracking', included: true },
      { label: 'Community support', included: true },
      { label: 'Approvals & inbox', included: false },
      { label: 'Budget caps & alerts', included: false },
      { label: 'Priority support', included: false },
      { label: 'SSO & audit logs', included: false },
    ],
    cta: 'Get Started Free',
    ctaLink: '/auth',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/agent/mo',
    description: 'For teams running agents in production.',
    features: [
      { label: 'Unlimited agents', included: true },
      { label: 'Unlimited events', included: true },
      { label: 'Live activity feed', included: true },
      { label: 'Advanced spend analytics', included: true },
      { label: 'Priority support', included: true },
      { label: 'Approvals & inbox', included: true },
      { label: 'Budget caps & alerts', included: true },
      { label: 'Real-time alerts', included: true },
      { label: 'SSO & audit logs', included: false },
    ],
    cta: 'Start Free Trial',
    ctaLink: '/auth',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For organisations with compliance and scale requirements.',
    features: [
      { label: 'Unlimited agents', included: true },
      { label: 'Unlimited events', included: true },
      { label: 'Live activity feed', included: true },
      { label: 'Advanced spend analytics', included: true },
      { label: 'Dedicated support', included: true },
      { label: 'Approvals & inbox', included: true },
      { label: 'Budget caps & alerts', included: true },
      { label: 'SSO & audit logs', included: true },
      { label: 'On-prem deployment', included: true },
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'How does per-agent billing work?',
    a: 'On the Pro plan, you are billed $29 per registered agent per month. If you have 5 agents, that\'s $145/month. Agents you delete mid-month are pro-rated.',
  },
  {
    q: 'What counts as an event?',
    a: 'Any POST to /v1/events — action, tool_call, completion, error, or approval_request. The Starter plan allows 1,000 events per day across all agents. Pro and Enterprise have no limit.',
  },
  {
    q: 'Can I try Pro features before committing?',
    a: 'Yes. Pro includes a 14-day free trial with no credit card required. You get full access to approvals, budget caps, and priority support from day one.',
  },
  {
    q: 'What happens if I exceed the Starter event limit?',
    a: 'Events beyond the daily limit are queued and processed the following day. No events are dropped — they\'re just delayed. Upgrade to Pro to remove the limit entirely.',
  },
  {
    q: 'Do I need to pay for the MCP server or Python SDK?',
    a: 'No. The MCP server (jarvis-mc-mcp) and Python SDK (jarvis-mc) are free and open source. You only pay for the Jarvis dashboard and API service.',
  },
  {
    q: 'Is there a discount for annual billing?',
    a: 'Annual billing is available at a 20% discount. Contact us to set it up.',
  },
];

export default function PricingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="eyebrow text-[#4F46E5] mb-4 block">Pricing</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Start free.
            <br />
            <span className="text-gradient">Scale with confidence.</span>
          </h1>
          <p className="text-[#A7ACBF] text-lg">
            No credit card required to start. Upgrade when you need approvals, unlimited events,
            or budget controls.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-24 md:pb-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`p-8 rounded-xl border ${
                  tier.highlighted
                    ? 'border-[#4F46E5] bg-[#4F46E5]/5'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {tier.badge && (
                  <span className="inline-block text-xs font-medium text-[#4F46E5] bg-[#4F46E5]/20 px-3 py-1 rounded-full mb-4">
                    {tier.badge}
                  </span>
                )}
                <h2 className="text-xl font-bold mb-1">{tier.name}</h2>
                <p className="text-sm text-[#A7ACBF] mb-4">{tier.description}</p>
                <div className="mb-8">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && <span className="text-[#A7ACBF] ml-1">{tier.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature.label} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <CheckCircle className="w-4 h-4 text-[#4F46E5] shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-white/20 shrink-0" />
                      )}
                      <span className={feature.included ? 'text-[#A7ACBF]' : 'text-white/20'}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={tier.ctaLink}
                  className={`block w-full py-3 rounded-lg font-medium text-center transition-all ${
                    tier.highlighted
                      ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
                      : 'border border-white/10 text-white hover:bg-white/5'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Full feature comparison</h2>
          </div>

          <div className="data-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 text-[#A7ACBF] font-medium w-1/2">Feature</th>
                  <th className="py-4 px-4 text-center font-medium">Starter</th>
                  <th className="py-4 px-4 text-center font-medium text-[#4F46E5]">Pro</th>
                  <th className="py-4 px-4 text-center font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Agents', starter: '3', pro: 'Unlimited', ent: 'Unlimited' },
                  { feature: 'Events/day', starter: '1,000', pro: 'Unlimited', ent: 'Unlimited' },
                  { feature: 'Live activity feed', starter: true, pro: true, ent: true },
                  { feature: 'Agent status & last seen', starter: true, pro: true, ent: true },
                  { feature: 'Basic spend tracking', starter: true, pro: true, ent: true },
                  { feature: 'Daily + monthly aggregation', starter: false, pro: true, ent: true },
                  { feature: 'Per-agent cost breakdown', starter: false, pro: true, ent: true },
                  { feature: 'Budget caps & alerts', starter: false, pro: true, ent: true },
                  { feature: 'Approval inbox', starter: false, pro: true, ent: true },
                  { feature: 'Command polling', starter: false, pro: true, ent: true },
                  { feature: 'MCP server', starter: true, pro: true, ent: true },
                  { feature: 'Python SDK', starter: true, pro: true, ent: true },
                  { feature: 'Community support', starter: true, pro: false, ent: false },
                  { feature: 'Priority support', starter: false, pro: true, ent: false },
                  { feature: 'Dedicated support', starter: false, pro: false, ent: true },
                  { feature: 'SSO', starter: false, pro: false, ent: true },
                  { feature: 'Audit log export', starter: false, pro: false, ent: true },
                  { feature: 'Custom retention', starter: false, pro: false, ent: true },
                  { feature: 'On-prem deployment', starter: false, pro: false, ent: true },
                  { feature: 'SLA guarantee', starter: false, pro: false, ent: true },
                ].map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white/[0.01]' : ''}>
                    <td className="py-3.5 px-6 text-[#A7ACBF]">{row.feature}</td>
                    {['starter', 'pro', 'ent'].map((key) => {
                      const val = row[key as keyof typeof row];
                      return (
                        <td key={key} className="py-3.5 px-4 text-center">
                          {typeof val === 'boolean' ? (
                            val ? (
                              <CheckCircle className={`w-4 h-4 mx-auto ${key === 'pro' ? 'text-[#4F46E5]' : 'text-green-400'}`} />
                            ) : (
                              <X className="w-4 h-4 mx-auto text-white/15" />
                            )
                          ) : (
                            <span className={key === 'pro' ? 'text-[#4F46E5] font-medium' : ''}>{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32 relative border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Pricing FAQ</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((item) => (
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
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Questions about pricing?
          </h2>
          <p className="text-[#A7ACBF] text-lg mb-10">
            We'll respond within one business day. Enterprise pricing, volume discounts, and
            annual billing are all available — just ask.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth" className="btn-primary">
              Start Free
            </Link>
            <Link to="/contact" className="btn-secondary">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
