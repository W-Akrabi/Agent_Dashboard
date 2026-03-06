import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import LiveActivityPage from './pages/features/LiveActivity';
import ApprovalsPage from './pages/features/Approvals';
import SpendControlPage from './pages/features/SpendControl';
import SecurityPage from './pages/features/Security';
import AboutPage from './pages/AboutPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import DocsPage from './pages/DocsPage';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Spend from './pages/Spend';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { InvalidationProvider } from './contexts/InvalidationContext';
import { Workshop } from './views/Workshop';
import { CommsHub } from './views/CommsHub';
import { KeyVault } from './views/KeyVault';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-[#05060B] flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#A7ACBF] font-mono text-sm">INITIALIZING...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <InvalidationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/features/live-activity" element={<LiveActivityPage />} />
          <Route path="/features/approvals" element={<ApprovalsPage />} />
          <Route path="/features/spend-control" element={<SpendControlPage />} />
          <Route path="/features/security" element={<SecurityPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/spend" element={<Spend />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/agents/:id" element={<AgentDetail />} />
              <Route path="/workshop" element={<Workshop />} />
              <Route path="/comms" element={<CommsHub />} />
              <Route path="/key-vault" element={<KeyVault />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Router>
      </InvalidationProvider>
    </AuthProvider>
  );
}
