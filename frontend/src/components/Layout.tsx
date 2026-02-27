import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Inbox, 
  CreditCard, 
  Bot, 
  KanbanSquare,
  Flame,
  Clock3,
  Network,
  MessageSquare,
  Moon,
  Wrench,
  Brain,
  KeyRound,
  Plug,
  FileText, 
  LogOut, 
  Menu,
  Bell
} from 'lucide-react';
import { getInbox } from '@/lib/api';

const sidebarItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Inbox', path: '/inbox', icon: Inbox, badge: true },
  { label: 'Workshop', path: '/workshop', icon: KanbanSquare },
  { label: 'Momentum', path: '/momentum', icon: Flame },
  { label: 'API Spend', path: '/spend', icon: CreditCard },
  { label: 'Scheduler', path: '/scheduler', icon: Clock3 },
  { label: 'Multi-Agent', path: '/multi-agent', icon: Network },
  { label: 'Comms Hub', path: '/comms', icon: MessageSquare },
  { label: 'Sleep Mode', path: '/sleep', icon: Moon },
  { label: 'Fix UI', path: '/fix-ui', icon: Wrench },
  { label: 'Memory', path: '/memory', icon: Brain },
  { label: 'Key Vault', path: '/key-vault', icon: KeyRound },
  { label: 'The Glue', path: '/glue', icon: Plug },
  { label: 'Agents', path: '/agents', icon: Bot },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPendingCount = async () => {
      try {
        const pendingItems = await getInbox('pending');
        if (!cancelled) {
          setPendingCount(pendingItems.length);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load pending approvals:', error);
        }
      }
    };

    loadPendingCount();
    const intervalId = window.setInterval(loadPendingCount, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/agents') return location.pathname.startsWith('/agents');
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-[#05060B] text-[#F4F6FF]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full w-64 bg-[#0B0E16] border-r border-white/5 z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">JARVIS</span>
          </Link>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const count = item.badge ? pendingCount : 0;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active 
                      ? 'bg-[#4F46E5]/20 text-white border-r-2 border-[#4F46E5]' 
                      : 'text-[#A7ACBF] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {count > 0 && (
                    <span className="ml-auto bg-[#4F46E5] text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white font-semibold">
              JD
            </div>
            <div>
              <p className="font-medium text-sm">John Doe</p>
              <p className="text-xs text-[#A7ACBF]">john@example.com</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#A7ACBF] hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header 
          className={`sticky top-0 z-30 px-6 py-4 transition-all duration-300 ${
            scrolled ? 'bg-[#05060B]/90 backdrop-blur-lg border-b border-white/5' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-[#A7ACBF] hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold">
                {sidebarItems.find(i => isActive(i.path))?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link 
                to="/inbox"
                className="relative p-2 text-[#A7ACBF] hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#4F46E5] rounded-full" />
                )}
              </Link>
              <a 
                href="#"
                className="hidden sm:flex items-center gap-2 text-[#A7ACBF] hover:text-white transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Docs</span>
              </a>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
