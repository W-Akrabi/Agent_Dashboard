import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Spend from './pages/Spend';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Workshop } from './views/Workshop';
import { Momentum } from './views/Momentum';
import { Scheduler } from './views/Scheduler';
import { MultiAgent } from './views/MultiAgent';
import { CommsHub } from './views/CommsHub';
import { SleepMode } from './views/SleepMode';
import { FixUI } from './views/FixUI';
import { Memory } from './views/Memory';
import { KeyVault } from './views/KeyVault';
import { IngestApi } from './views/IngestApi';

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
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/spend" element={<Spend />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/workshop" element={<Workshop />} />
            <Route path="/momentum" element={<Momentum />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/multi-agent" element={<MultiAgent />} />
            <Route path="/comms" element={<CommsHub />} />
            <Route path="/sleep" element={<SleepMode />} />
            <Route path="/fix-ui" element={<FixUI />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/key-vault" element={<KeyVault />} />
            <Route path="/glue" element={<IngestApi />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}
