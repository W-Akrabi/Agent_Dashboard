import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { 
  Activity, 
  Shield, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Bot,
  Lock,
  Code,
  FileSearch,
  Settings
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const approvalsRef = useRef<HTMLDivElement>(null);
  const spendRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const useCasesRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance animation
      const heroTl = gsap.timeline({ delay: 0.3 });
      heroTl
        .from('.hero-badge', { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' })
        .from('.hero-title span', { 
          opacity: 0, 
          y: 28, 
          rotateX: 35, 
          duration: 0.8, 
          stagger: 0.08,
          ease: 'power2.out' 
        }, '-=0.3')
        .from('.hero-subtitle', { opacity: 0, y: 18, duration: 0.6 }, '-=0.4')
        .from('.hero-ctas', { opacity: 0, y: 18, duration: 0.6 }, '-=0.3')
        .from('.hero-visual', { 
          opacity: 0, 
          scale: 0.92, 
          rotate: -6, 
          duration: 1,
          ease: 'power2.out' 
        }, '-=0.8');

      // Activity section
      gsap.from(activityRef.current?.querySelectorAll('.animate-in') || [], {
        scrollTrigger: {
          trigger: activityRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Approvals section
      gsap.from(approvalsRef.current?.querySelectorAll('.animate-in') || [], {
        scrollTrigger: {
          trigger: approvalsRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Spend section
      gsap.from(spendRef.current?.querySelectorAll('.animate-in') || [], {
        scrollTrigger: {
          trigger: spendRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Security section
      gsap.from(securityRef.current?.querySelectorAll('.animate-in') || [], {
        scrollTrigger: {
          trigger: securityRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Use cases section
      gsap.from(useCasesRef.current?.querySelectorAll('.use-case-card') || [], {
        scrollTrigger: {
          trigger: useCasesRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 50,
        rotateX: 12,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Testimonials section
      gsap.from(testimonialsRef.current?.querySelectorAll('.testimonial-card') || [], {
        scrollTrigger: {
          trigger: testimonialsRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 40,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Pricing section
      gsap.from(pricingRef.current?.querySelectorAll('.pricing-card') || [], {
        scrollTrigger: {
          trigger: pricingRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 50,
        rotateX: 10,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Contact section
      gsap.from(contactRef.current?.querySelectorAll('.animate-in') || [], {
        scrollTrigger: {
          trigger: contactRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-[#05060B] text-[#F4F6FF] overflow-x-clip">
      {/* HUD Frame */}
      <div className="hud-frame">
        <div className="hud-frame-left" />
        <div className="hud-frame-right" />
      </div>
      
      {/* Scanline Overlay */}
      <div className="scanline-overlay" />
      
      {/* Starfield */}
      <div className="starfield" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">JARVIS</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-[#A7ACBF] hover:text-white transition-colors text-sm hidden sm:block">
              Docs
            </a>
            <Link to="/auth" className="text-[#A7ACBF] hover:text-white transition-colors text-sm">
              Login
            </Link>
            <Link to="/auth" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section — full viewport with Spline 3D */}
      <section ref={heroRef} className="h-screen relative overflow-hidden">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#4F46E5"
        />

        <div className="flex h-full pt-16">
          {/* Left — text content */}
          <div className="flex-1 flex flex-col justify-center px-8 md:px-16 relative z-10">
            <div className="hero-badge inline-block mb-6">
              <span className="eyebrow text-[#4F46E5] border-b border-[#4F46E5] pb-1">
                PRIVATE BETA
              </span>
            </div>

            <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl font-bold mb-6 uppercase tracking-tight">
              <span className="inline-block">One Dashboard.</span>
              <br />
              <span className="inline-block text-gradient">Total Control.</span>
            </h1>

            <p className="hero-subtitle text-lg text-[#A7ACBF] max-w-md mb-10">
              Jarvis is the oversight layer for AI agents. See every action, approve what matters,
              and keep costs predictable.
            </p>

            <div className="hero-ctas flex flex-col sm:flex-row gap-4">
              <Link to="/auth" className="btn-primary w-full sm:w-auto">
                Request Access
              </Link>
              <a href="#" className="btn-secondary w-full sm:w-auto">
                View Docs
              </a>
            </div>
          </div>

          {/* Right — Spline 3D scene */}
          <div className="flex-1 relative">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Dashboard Preview — ContainerScroll */}
      <section className="relative z-10">
        <ContainerScroll
          titleComponent={
            <h2 className="text-3xl md:text-4xl font-bold text-[#F4F6FF] mb-4">
              Your agents. <span className="text-gradient">At a glance.</span>
            </h2>
          }
        >
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80"
            alt="Jarvis Mission Control dashboard preview"
            className="mx-auto rounded-2xl object-cover h-full w-full object-top"
            draggable={false}
          />
        </ContainerScroll>
      </section>

      {/* Live Activity Section */}
      <section ref={activityRef} className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="animate-in">
              <span className="eyebrow text-[#4F46E5] mb-4 block">Live Activity</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                See everything your agents are doing.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                Events stream in as they happen: tool calls, completions, errors, and cost per step. 
                No more digging through logs.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Real-time event stream',
                  'Per-step cost attribution',
                  'Filter by agent, type, or time',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4F46E5]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-flex items-center gap-2 text-[#4F46E5] hover:gap-3 transition-all">
                Explore the feed <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="animate-in">
              <div className="data-card p-6 space-y-4">
                {[
                  { agent: 'Research Assistant', action: 'Searched web for "AI orchestration"', cost: 0.02, time: '2m ago' },
                  { agent: 'Data Processor', action: 'Validated data schema', cost: 0.04, time: '5m ago', active: true },
                  { agent: 'Code Reviewer', action: 'Analyzed PR #234', cost: 0.03, time: '8m ago' },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-lg border transition-all ${
                      item.active 
                        ? 'border-[#4F46E5]/50 bg-[#4F46E5]/10' 
                        : 'border-white/5 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{item.agent}</span>
                      <span className="text-xs text-[#A7ACBF]">{item.time}</span>
                    </div>
                    <p className="text-sm text-[#A7ACBF] mb-2">{item.action}</p>
                    <span className="text-xs font-mono text-[#4F46E5]">${item.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Approvals Section */}
      <section ref={approvalsRef} className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 animate-in">
              <div className="data-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#4F46E5]" />
                  </div>
                  <div>
                    <p className="font-medium">Data Processor</p>
                    <p className="text-xs text-[#A7ACBF]">Requesting approval</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-[#A7ACBF]">Validated data schema</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-[#A7ACBF]">Checked API rate limits</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-[#4F46E5] mt-0.5" />
                    <span className="text-sm">Process 10,000 customer records</span>
                  </div>
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

            <div className="order-1 lg:order-2 animate-in">
              <span className="eyebrow text-[#4F46E5] mb-4 block">Approvals</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Stay in control with human-in-the-loop.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                Require approval for sensitive actions. Set rules by cost, risk, or scope. 
                Jarvis holds the action until you decide.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Require approval for high-cost steps',
                  'Auto-approve by trust rules',
                  'Audit trail for every decision',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4F46E5]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/inbox" className="inline-flex items-center gap-2 text-[#4F46E5] hover:gap-3 transition-all">
                See how approvals work <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Spend Control Section */}
      <section ref={spendRef} className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="animate-in">
              <span className="eyebrow text-[#4F46E5] mb-4 block">Spend Control</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Predictable costs. No surprises.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                Set monthly budgets, get alerts as you approach limits, and attribute spend 
                down to the individual agent and step.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Monthly budget caps',
                  'Per-agent spend attribution',
                  'Alerts at 50%, 80%, 100%',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4F46E5]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/spend" className="inline-flex items-center gap-2 text-[#4F46E5] hover:gap-3 transition-all">
                View pricing <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="animate-in">
              <div className="data-card p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">Monthly Budget</span>
                  <span className="text-sm text-[#A7ACBF]">$751 / $1,000</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full" style={{ width: '75%' }} />
                </div>
                
                <div className="pt-4 space-y-3">
                  {[
                    { name: 'Data Processor', spend: 245.80, percent: 33 },
                    { name: 'Content Generator', spend: 178.90, percent: 24 },
                    { name: 'Research Assistant', spend: 124.50, percent: 17 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-[#A7ACBF]">{item.name}</span>
                      <span className="text-sm font-mono">${item.spend.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section ref={securityRef} className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 animate-in">
              <div className="data-card p-6 space-y-4">
                {[
                  { icon: Lock, title: 'SSO + MFA', desc: 'Enterprise authentication' },
                  { icon: Shield, title: 'RBAC', desc: 'Role-based access control' },
                  { icon: Activity, title: 'Audit Logs', desc: 'Full history of all actions' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                    <div className="w-10 h-10 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#4F46E5]" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-[#A7ACBF]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2 animate-in">
              <span className="eyebrow text-[#4F46E5] mb-4 block">Security</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Built for production teams.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                SSO, role-based access, encrypted tokens, and a full audit trail. 
                Deploy with confidence.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'SSO + MFA',
                  'RBAC with scoped tokens',
                  'Full audit history',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4F46E5]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="#" className="inline-flex items-center gap-2 text-[#4F46E5] hover:gap-3 transition-all">
                Read security docs <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section ref={useCasesRef} className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="eyebrow text-[#4F46E5] mb-4 block">Use Cases</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Three ways teams use Jarvis.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: FileSearch, 
                title: 'Research Agent', 
                desc: 'Summarize documents, search the web, and compile reports—with approvals for external calls.' 
              },
              { 
                icon: Code, 
                title: 'Code Agent', 
                desc: 'Generate, test, and commit code. Jarvis tracks spend per task and pauses on failures.' 
              },
              { 
                icon: Settings, 
                title: 'Ops Agent', 
                desc: 'Automate alerts, ticketing, and remediation. Human-in-the-loop for any destructive action.' 
              },
            ].map((item, i) => (
              <div key={i} className="use-case-card data-card p-8">
                <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/20 flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6 text-[#4F46E5]" />
                </div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-[#A7ACBF]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="eyebrow text-[#4F46E5] mb-4 block">Testimonials</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              What early teams are saying.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                quote: "Jarvis turned our agent scripts into something the whole team can trust. Approvals alone saved us from a costly mistake.",
                author: 'Alex R.',
                role: 'Platform Lead',
              },
              {
                quote: "We finally know what our agents cost. The budget alerts are simple, but they changed how we ship.",
                author: 'Sam T.',
                role: 'Engineering Manager',
              },
            ].map((item, i) => (
              <div key={i} className="testimonial-card data-card p-8">
                <p className="text-lg mb-6 leading-relaxed">"{item.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white font-semibold">
                    {item.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{item.author}</p>
                    <p className="text-sm text-[#A7ACBF]">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="eyebrow text-[#4F46E5] mb-4 block">Pricing</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Start free. Scale with confidence.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                features: [
                  'Up to 3 agents',
                  '1,000 events/day',
                  'Basic spend tracking',
                  'Community support',
                ],
                cta: 'Get Started',
                secondary: true,
              },
              {
                name: 'Pro',
                price: '$29',
                period: '/agent/mo',
                features: [
                  'Unlimited agents',
                  'Unlimited events',
                  'Approvals & budgets',
                  'Real-time alerts',
                  'Priority support',
                ],
                cta: 'Start Trial',
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                features: [
                  'SSO & audit logs',
                  'Custom retention',
                  'SLA guarantee',
                  'Dedicated support',
                  'On-prem option',
                ],
                cta: 'Contact Sales',
                secondary: true,
              },
            ].map((item, i) => (
              <div 
                key={i} 
                className={`pricing-card p-8 rounded-xl border ${
                  item.highlighted 
                    ? 'border-[#4F46E5] bg-[#4F46E5]/5' 
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {item.highlighted && (
                  <span className="inline-block text-xs font-medium text-[#4F46E5] bg-[#4F46E5]/20 px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{item.price}</span>
                  {item.period && <span className="text-[#A7ACBF]">{item.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {item.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-[#4F46E5]" />
                      <span className="text-[#A7ACBF]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-lg font-medium transition-all ${
                  item.highlighted 
                    ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]' 
                    : 'border border-white/10 text-white hover:bg-white/5'
                }`}>
                  {item.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} className="py-24 md:py-32 relative">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="animate-in text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to take control?
          </h2>
          <p className="animate-in text-[#A7ACBF] text-lg mb-10">
            Get early access, ask a question, or schedule a walkthrough. 
            We'll respond within one business day.
          </p>
          <div className="animate-in flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/auth" className="btn-primary w-full sm:w-auto">
              Request Access
            </Link>
            <a href="#" className="btn-secondary w-full sm:w-auto">
              Contact Sales
            </a>
          </div>
          <div className="animate-in flex flex-wrap items-center justify-center gap-6 text-sm text-[#A7ACBF]">
            <a href="mailto:support@jarvisctl.io" className="hover:text-white transition-colors">
              support@jarvisctl.io
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-white transition-colors">
              Status
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-white transition-colors">
              Docs
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">JARVIS</span>
            </Link>
            <p className="text-sm text-[#A7ACBF]">
              © 2026 Jarvis Mission Control. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
