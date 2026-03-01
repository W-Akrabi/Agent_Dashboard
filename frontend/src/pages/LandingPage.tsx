import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { Header1 } from '@/components/ui/header';
import { 
  Activity, 
  Shield, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Bot,
  Lock,
  Code,
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
      <Header1 />

      {/* Hero Section — full viewport with Spline 3D */}
      <section ref={heroRef} className="h-screen relative overflow-hidden">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#4F46E5"
        />

        {/* Spline 3D scene — full background */}
        <div className="absolute inset-0">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>

        {/* Text overlay */}
        <div className="relative z-10 flex h-full pt-16 pointer-events-none">
          <div className="flex flex-col justify-center px-8 md:px-16 max-w-2xl">
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
              Register your agents, stream every event in real time, gate sensitive actions
              behind human approval, and track spend down to the cent — all in one place.
            </p>

            <div className="hero-ctas flex flex-col sm:flex-row gap-4 pointer-events-auto">
              <Link to="/auth" className="btn-primary w-full sm:w-auto">
                Request Access
              </Link>
              <a href="#" className="btn-secondary w-full sm:w-auto">
                View Docs
              </a>
            </div>
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
                Every action. Every cost. In real time.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                Agents push events as they run — tool calls, completions, errors, and approval requests —
                each tagged with a dollar cost. The live feed shows the 50 most recent events across
                all your agents the moment they happen.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Five event types: action, tool_call, completion, error, approval_request',
                  'Per-event cost in dollars, aggregated daily and monthly',
                  'Agent last_seen_at updated on every event; status set to waiting_approval on approval requests',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4F46E5]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-flex items-center gap-2 text-[#4F46E5] hover:gap-3 transition-all">
                See the live feed <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="animate-in">
              <div className="data-card p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-[#A7ACBF] font-mono uppercase tracking-widest">Live</span>
                </div>
                {[
                  { agent: 'writer-agent', type: 'tool_call', action: 'Called `read_file` on /output/draft.md', cost: 0.01, time: 'just now', active: true },
                  { agent: 'research-agent', type: 'completion', action: 'Finished summarising 14 research papers', cost: 0.08, time: '1m ago' },
                  { agent: 'ops-agent', type: 'approval_request', action: 'Requesting approval to send email to 312 recipients', cost: 0.00, time: '3m ago' },
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
                      <span className="font-medium text-sm font-mono">{item.agent}</span>
                      <span className="text-xs text-[#A7ACBF]">{item.time}</span>
                    </div>
                    <p className="text-sm text-[#A7ACBF] mb-2">{item.action}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#4F46E5]">${item.cost.toFixed(2)}</span>
                      <span className="text-xs text-[#A7ACBF]/60 font-mono">{item.type}</span>
                    </div>
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
                    <p className="font-medium font-mono">ops-agent</p>
                    <p className="text-xs text-[#A7ACBF]">waiting_approval</p>
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

                <p className="text-xs text-[#A7ACBF] uppercase tracking-widest mb-3">Proposed next action</p>
                <div className="flex items-start gap-2 mb-6 p-3 rounded-lg border border-[#4F46E5]/30 bg-[#4F46E5]/5">
                  <ArrowRight className="w-4 h-4 text-[#4F46E5] mt-0.5 shrink-0" />
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

            <div className="order-1 lg:order-2 animate-in">
              <span className="eyebrow text-[#4F46E5] mb-4 block">Approvals</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Your agent pauses. You decide. It continues.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                When an agent sets <code className="text-[#4F46E5] bg-white/5 px-1 rounded">requiresApproval: true</code>, Jarvis
                holds it in a <code className="text-[#4F46E5] bg-white/5 px-1 rounded">waiting_approval</code> state and surfaces the
                request in your inbox — showing what it has already done and exactly what it wants to do next.
                Your decision is delivered back to the agent via the command polling API.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Agent status set to waiting_approval automatically',
                  'Approve or reject with an optional comment',
                  'Decision delivered via command polling — no webhook needed',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4F46E5]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-flex items-center gap-2 text-[#4F46E5] hover:gap-3 transition-all">
                Open the inbox <ArrowRight className="w-4 h-4" />
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
                Know exactly what your agents cost.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                Every event carries a dollar cost. Jarvis aggregates that into daily and monthly totals,
                breaks it down per agent, and measures it against a budget cap you set and can edit any time.
                A colour-coded progress bar turns orange at 80% and red when you're over.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Daily and monthly spend aggregated automatically',
                  'Per-agent cost breakdown on the dashboard',
                  'Editable monthly budget cap — warning at 80%, alert at 100%',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4F46E5]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-flex items-center gap-2 text-[#4F46E5] hover:gap-3 transition-all">
                View the spend dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="animate-in">
              <div className="data-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Monthly Budget</span>
                  <span className="text-sm text-[#A7ACBF]">$843 / $1,000</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" style={{ width: '84%' }} />
                </div>
                <p className="text-xs text-orange-400">84% used — approaching your monthly cap</p>

                <div className="pt-2 space-y-3 border-t border-white/5">
                  <p className="text-xs text-[#A7ACBF] uppercase tracking-widest pt-1">Per-agent breakdown</p>
                  {[
                    { name: 'writer-agent', spend: 312.40 },
                    { name: 'research-agent', spend: 287.60 },
                    { name: 'ops-agent', spend: 243.00 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-[#A7ACBF] font-mono">{item.name}</span>
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
                  { icon: Lock, title: 'SHA-256 hashed agent tokens', desc: 'Tokens are shown once and never stored in plaintext' },
                  { icon: Shield, title: 'Workspace isolation via RLS', desc: 'Supabase Row-Level Security keeps every workspace strictly separate' },
                  { icon: Activity, title: 'Immutable event log', desc: 'Every action, cost, and approval decision is recorded and cannot be deleted' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                    <div className="w-10 h-10 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center shrink-0">
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
                Secure by default, not by configuration.
              </h2>
              <p className="text-[#A7ACBF] text-lg mb-8">
                Agent tokens are hashed with SHA-256 before storage — the plaintext is shown once and gone.
                Supabase Auth handles dashboard login, and Row-Level Security enforces workspace boundaries
                at the database layer so no query can cross tenant lines.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'JWT authentication (RS256 / HS256) for dashboard sessions',
                  'One active token per agent — revoke and regenerate any time',
                  'All decisions logged with agent ID, timestamp, and optional comment',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#4F46E5]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
              Built for how people actually run agents.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Code,
                title: 'Solo Developer',
                desc: "You're running Claude or GPT agents locally. Jarvis gives you a live feed of every tool call and its exact dollar cost — so nothing runs blind and no bill surprises you at month end.",
              },
              {
                icon: Bot,
                title: 'Production Team',
                desc: 'Gate destructive or expensive actions behind mandatory human approval. The agent pauses at the critical step, your team reviews what it has done and what it wants to do next, then decides.',
              },
              {
                icon: Settings,
                title: 'Multi-Agent Orchestration',
                desc: 'Register multiple agents under one workspace. Track each one independently — its status, spend, and event history — and pause or revoke any agent without touching the others.',
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
