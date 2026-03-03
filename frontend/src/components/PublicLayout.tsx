import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { Header1 } from '@/components/ui/header';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05060B] text-[#F4F6FF] overflow-x-clip">
      <div className="hud-frame">
        <div className="hud-frame-left" />
        <div className="hud-frame-right" />
      </div>
      <div className="scanline-overlay" />
      <div className="starfield" />
      <Header1 />
      <main className="pt-16">{children}</main>
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">JARVIS</span>
            </Link>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-[#A7ACBF]">
              <Link to="/features/live-activity" className="hover:text-white transition-colors">Live Activity</Link>
              <Link to="/features/approvals" className="hover:text-white transition-colors">Approvals</Link>
              <Link to="/features/spend-control" className="hover:text-white transition-colors">Spend Control</Link>
              <Link to="/features/security" className="hover:text-white transition-colors">Security</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link to="/docs" className="hover:text-white transition-colors">Docs</Link>
            </nav>
            <p className="text-sm text-[#A7ACBF]">© 2026 Jarvis Mission Control.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
