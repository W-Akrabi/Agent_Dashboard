import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Inbox,
  CreditCard,
  Bot,
  KanbanSquare,
  Clock3,
  MessageSquare,
  Moon,
  Brain,
  KeyRound,
  Plug,
  FileText,
  LogOut,
  Bell,
} from 'lucide-react';
import { getInbox } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useInvalidation } from '@/contexts/InvalidationContext';
import { supabase } from '@/lib/supabase';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  type SidebarLinkItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems: SidebarLinkItem[] = [
  { label: 'Dashboard',   href: '/dashboard',   icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> },
  { label: 'Inbox',       href: '/inbox',       icon: <Inbox           className="w-5 h-5 flex-shrink-0" /> },
  { label: 'Workshop',    href: '/workshop',    icon: <KanbanSquare    className="w-5 h-5 flex-shrink-0" /> },
  { label: 'API Spend',   href: '/spend',       icon: <CreditCard      className="w-5 h-5 flex-shrink-0" /> },
  { label: 'Scheduler',   href: '/scheduler',   icon: <Clock3          className="w-5 h-5 flex-shrink-0" /> },
  { label: 'Comms Hub',   href: '/comms',       icon: <MessageSquare   className="w-5 h-5 flex-shrink-0" /> },
  { label: 'Sleep Mode',  href: '/sleep',       icon: <Moon            className="w-5 h-5 flex-shrink-0" /> },
  { label: 'Memory',      href: '/memory',      icon: <Brain           className="w-5 h-5 flex-shrink-0" /> },
  { label: 'Key Vault',   href: '/key-vault',   icon: <KeyRound        className="w-5 h-5 flex-shrink-0" /> },
  { label: 'The Glue',    href: '/glue',        icon: <Plug            className="w-5 h-5 flex-shrink-0" /> },
  { label: 'Agents',      href: '/agents',      icon: <Bot             className="w-5 h-5 flex-shrink-0" /> },
];

const SidebarLogo = () => (
  <Link to="/" className="flex items-center gap-3 mb-8 px-2 py-1">
    <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center flex-shrink-0">
      <Bot className="w-5 h-5 text-white" />
    </div>
    <motion.span
      className="font-bold text-lg tracking-tight text-[#F4F6FF] whitespace-pre"
    >
      JARVIS
    </motion.span>
  </Link>
);

const SidebarLogoIcon = () => (
  <Link to="/" className="flex items-center gap-3 mb-8 px-2 py-1">
    <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center flex-shrink-0">
      <Bot className="w-5 h-5 text-white" />
    </div>
  </Link>
);

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const { subscribe, isConnected } = useInvalidation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadPendingCount = async () => {
    try {
      const pendingItems = await getInbox('pending');
      setPendingCount(pendingItems.length);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    }
  };

  useEffect(() => {
    void loadPendingCount();
    return subscribe('tasks', () => { void loadPendingCount(); });
  }, [subscribe]);

  const email = user?.email ?? '';
  const localPart = email.split('@')[0];
  const initials = localPart.slice(0, 2).toUpperCase();
  const displayName = localPart.charAt(0).toUpperCase() + localPart.slice(1);

  const isActive = (href: string) => {
    if (href === '/agents') return location.pathname.startsWith('/agents');
    return location.pathname === href;
  };

  const currentLabel = navItems.find(i => isActive(i.href))?.label ?? 'Dashboard';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#05060B] text-[#F4F6FF] overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody
          className="justify-between gap-6 bg-[#0B0E16] border-r border-white/5"
        >
          {/* Top: logo + nav */}
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {sidebarOpen ? <SidebarLogo /> : <SidebarLogoIcon />}

            <div className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const active = isActive(item.href);
                // Inject pending badge into the icon slot for Inbox
                const icon = item.href === '/inbox' && pendingCount > 0
                  ? (
                    <span className="relative flex-shrink-0">
                      {item.icon}
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#4F46E5] rounded-full" />
                    </span>
                  )
                  : item.icon;

                return (
                  <SidebarLink
                    key={item.href}
                    link={{ ...item, icon }}
                    className={cn(
                      active
                        ? 'bg-[#4F46E5]/20 text-white'
                        : 'text-[#A7ACBF] hover:bg-white/5 hover:text-white'
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom: user + sign out */}
          <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {initials}
              </div>
              <motion.div
                animate={{
                  display: sidebarOpen ? 'block' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-medium text-[#F4F6FF] whitespace-nowrap">{displayName}</p>
                <p className="text-xs text-[#A7ACBF] whitespace-nowrap truncate max-w-[140px]">{email}</p>
              </motion.div>
            </div>

            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-3 px-2 py-2 rounded-lg text-[#A7ACBF] hover:bg-white/5 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: sidebarOpen ? 'inline-block' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                transition={{ duration: 0.15 }}
                className="text-sm font-medium whitespace-pre"
              >
                Sign out
              </motion.span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Header */}
        <header
          className={`sticky top-0 z-30 px-6 py-4 transition-all duration-300 ${
            scrolled ? 'bg-[#05060B]/90 backdrop-blur-lg border-b border-white/5' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">{currentLabel}</h1>

            <div className="flex items-center gap-4">
              {isConnected ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: '0 0 6px #22c55e' }} />
                  <span className="text-xs font-medium text-green-400 tracking-wider">LIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 6px #ef4444' }} />
                  <span className="text-xs font-medium text-red-400 tracking-wider">RECONNECTING</span>
                </div>
              )}
              <Link to="/inbox" className="relative p-2 text-[#A7ACBF] hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#4F46E5] rounded-full" />
                )}
              </Link>
              <a href="#" className="hidden sm:flex items-center gap-2 text-[#A7ACBF] hover:text-white transition-colors text-sm">
                <FileText className="w-4 h-4" />
                <span>Docs</span>
              </a>
            </div>
          </div>
        </header>

        {!isConnected && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2 text-sm text-red-300 flex items-center gap-2">
            <span>⚠️</span>
            <span>Live updates paused — reconnecting…</span>
          </div>
        )}

        <div className="p-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
