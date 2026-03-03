import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Calendar, ArrowRight, Clock } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

export default function ContactPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="eyebrow text-[#4F46E5] mb-4 block">Contact</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Let's talk.
          </h1>
          <p className="text-[#A7ACBF] text-lg max-w-xl mx-auto">
            Questions about the product, pricing, enterprise requirements, or security — we respond
            within one business day.
          </p>
        </div>
      </section>

      {/* Contact options */}
      <section className="pb-24 md:pb-32 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Mail,
                title: 'Email us',
                desc: 'For general enquiries, support questions, and security disclosures.',
                action: 'support@jarvisctl.io',
                href: 'mailto:support@jarvisctl.io',
                label: 'Send email',
              },
              {
                icon: MessageSquare,
                title: 'Request access',
                desc: "We're in private beta. Sign up and we'll send you an invite when there's a spot.",
                action: 'Request beta access',
                href: '/auth',
                label: 'Get on the list',
              },
              {
                icon: Calendar,
                title: 'Schedule a call',
                desc: 'Want a walkthrough, a security review, or to discuss enterprise requirements?',
                action: 'Book 30 minutes',
                href: 'mailto:support@jarvisctl.io?subject=Schedule a call',
                label: 'Book a call',
              },
            ].map((item) => (
              <div key={item.title} className="data-card p-6 flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <h2 className="font-semibold mb-2">{item.title}</h2>
                <p className="text-sm text-[#A7ACBF] mb-6 flex-1">{item.desc}</p>
                <a
                  href={item.href.startsWith('mailto') ? item.href : undefined}
                  className="inline-flex items-center gap-2 text-sm text-[#4F46E5] hover:gap-3 transition-all font-medium"
                  {...(item.href.startsWith('/') ? {} : {})}
                >
                  {item.label} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          {/* Main contact section */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Before you reach out</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#4F46E5]" />
                    Response times
                  </h3>
                  <div className="space-y-2 text-sm text-[#A7ACBF]">
                    <p>General enquiries — within 1 business day</p>
                    <p>Pro plan support — within 4 hours</p>
                    <p>Enterprise / security — within 2 hours</p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6">
                  <h3 className="font-medium mb-3">Common questions</h3>
                  <div className="space-y-3">
                    {[
                      { q: 'How do I get started?', link: '/auth', label: 'Sign up — it\'s free' },
                      { q: 'How do I connect my agent?', link: '/docs', label: 'Read the quick start guide' },
                      { q: 'What does it cost?', link: '/pricing', label: 'See pricing' },
                      { q: 'Is my data secure?', link: '/features/security', label: 'Read the security page' },
                    ].map((item) => (
                      <div key={item.q} className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-[#A7ACBF]">{item.q}</span>
                        <Link to={item.link} className="text-xs text-[#4F46E5] hover:underline whitespace-nowrap ml-4">
                          {item.label}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6">
                  <h3 className="font-medium mb-3">Enterprise enquiries</h3>
                  <p className="text-sm text-[#A7ACBF] mb-4">
                    If you're evaluating Jarvis for a team and need SSO, SLA guarantees, audit log
                    export, custom retention, or on-prem deployment — email us directly:
                  </p>
                  <a
                    href="mailto:enterprise@jarvisctl.io"
                    className="inline-flex items-center gap-2 text-sm text-[#4F46E5] font-medium hover:underline"
                  >
                    enterprise@jarvisctl.io <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick send */}
            <div className="data-card p-6">
              <h2 className="text-xl font-bold mb-6">Send us a message</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#A7ACBF] mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#4F46E5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#A7ACBF] mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#4F46E5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#A7ACBF] mb-2">Subject</label>
                  <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#4F46E5] text-sm text-[#F4F6FF]">
                    <option value="" className="bg-[#0B0E16]">Select a topic</option>
                    <option value="general" className="bg-[#0B0E16]">General question</option>
                    <option value="support" className="bg-[#0B0E16]">Technical support</option>
                    <option value="enterprise" className="bg-[#0B0E16]">Enterprise / sales</option>
                    <option value="security" className="bg-[#0B0E16]">Security disclosure</option>
                    <option value="feedback" className="bg-[#0B0E16]">Product feedback</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#A7ACBF] mb-2">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Tell us what you need..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#4F46E5] text-sm resize-none"
                  />
                </div>
                <a
                  href="mailto:support@jarvisctl.io"
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Send message <ArrowRight className="w-4 h-4" />
                </a>
                <p className="text-xs text-[#A7ACBF] text-center">
                  Or email us directly at{' '}
                  <a href="mailto:support@jarvisctl.io" className="text-[#4F46E5] hover:underline">
                    support@jarvisctl.io
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
