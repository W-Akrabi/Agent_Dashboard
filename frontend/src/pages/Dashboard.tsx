import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Inbox,
  DollarSign,
  Activity,
  Play,
  Pause,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { getAgents, getEvents, getInbox, getSpend, updateAgentStatus } from '@/lib/api';
import type { Agent, AgentEvent, SpendData } from '@/types/index';
import { ToggleIcon } from '@/components/ui/animated-state-icons';
import { useInvalidation } from '@/contexts/InvalidationContext';

const statusConfig = {
  running: { color: 'text-green-400', bg: 'bg-green-400/10', icon: Play, label: 'Running' },
  idle: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Clock, label: 'Idle' },
  paused: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Pause, label: 'Paused' },
  error: { color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertCircle, label: 'Error' },
  waiting_approval: { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Inbox, label: 'Waiting' },
};

const eventTypeConfig = {
  action: { color: 'text-blue-400', label: 'Action' },
  completion: { color: 'text-green-400', label: 'Completion' },
  error: { color: 'text-red-400', label: 'Error' },
  tool_call: { color: 'text-purple-400', label: 'Tool' },
  approval_request: { color: 'text-orange-400', label: 'Approval' },
};

const defaultSpendData: SpendData = {
  daily: 0,
  monthly: 0,
  budget: 1000,
  agentBreakdown: [],
};

export default function Dashboard() {
  const { subscribe } = useInvalidation();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [spendData, setSpendData] = useState<SpendData>(defaultSpendData);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const [agentsRes, eventsRes, spendRes, pendingRes] = await Promise.all([
        getAgents(),
        getEvents(50),
        getSpend(),
        getInbox('pending'),
      ]);
      setAgents(agentsRes);
      setEvents(eventsRes);
      setSpendData(spendRes);
      setPendingCount(pendingRes.length);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubEvents = subscribe('events', loadData);
    const unsubAgents = subscribe('agents', loadData);
    const unsubTasks = subscribe('tasks', loadData);
    return () => {
      unsubEvents();
      unsubAgents();
      unsubTasks();
    };
  }, [subscribe]);

  const activeAgents = useMemo(
    () => agents.filter((agent) => agent.status === 'running').length,
    [agents]
  );
  const totalSpend = spendData.monthly;
  const budgetPercent = spendData.budget > 0 ? (totalSpend / spendData.budget) * 100 : 0;

  const toggleAgentStatus = async (agentId: string) => {
    const target = agents.find((agent) => agent.id === agentId);
    if (!target) return;

    const newStatus: Agent['status'] = target.status === 'running' ? 'paused' : 'running';
    try {
      const updated = await updateAgentStatus(agentId, newStatus);
      setAgents((prev) => prev.map((agent) => (agent.id === agentId ? updated : agent)));
    } catch (toggleError) {
      console.error(toggleError);
      setError(toggleError instanceof Error ? toggleError.message : 'Failed to update agent status.');
    }
  };

  if (isLoading) {
    return (
      <div className="data-card p-8 text-center">
        <p className="text-[#A7ACBF]">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Active Agents</span>
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center">
              <ToggleIcon size={20} color="#4F46E5" />
            </div>
          </div>
          <p className="text-2xl font-bold">{activeAgents}</p>
          <p className="text-xs text-[#A7ACBF] mt-1">of {agents.length} total</p>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Inbox className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">{pendingCount}</p>
          <Link to="/inbox" className="text-xs text-[#4F46E5] hover:underline mt-1 inline-block">
            View inbox →
          </Link>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Today's Spend</span>
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">${spendData.daily.toFixed(2)}</p>
          <p className="text-xs text-[#A7ACBF] mt-1">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Monthly trend
          </p>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Monthly Budget</span>
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#4F46E5]" />
            </div>
          </div>
          <p className="text-2xl font-bold">{budgetPercent.toFixed(0)}%</p>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${budgetPercent > 80 ? 'bg-red-500' : 'bg-[#4F46E5]'}`}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Agents</h2>
            <Link to="/agents" className="text-sm text-[#4F46E5] hover:underline">
              View all →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const status = statusConfig[agent.status];
              const StatusIcon = status.icon;

              return (
                <div key={agent.id} className="data-card p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center`}>
                        <Bot className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{agent.name}</h3>
                        <span className={`text-xs ${status.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => void toggleAgentStatus(agent.id)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {agent.status === 'running' ? (
                        <Pause className="w-4 h-4 text-[#A7ACBF]" />
                      ) : (
                        <Play className="w-4 h-4 text-[#A7ACBF]" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#A7ACBF] text-xs mb-1">Total Spend</p>
                      <p className="font-mono">${agent.totalSpend.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[#A7ACBF] text-xs mb-1">Events</p>
                      <p className="font-mono">{agent.eventsCount}</p>
                    </div>
                  </div>

                  <Link to={`/agents/${agent.id}`} className="mt-4 text-xs text-[#4F46E5] hover:underline block">
                    View details →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Activity</h2>
            <span className="flex items-center gap-2 text-xs text-[#A7ACBF]">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>

          <div className="data-card p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {events.map((event) => {
              const typeConfig = eventTypeConfig[event.type];
              const agent = agents.find((a) => a.id === event.agentId);

              return (
                <div key={event.id} className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{agent?.name || 'Unknown'}</span>
                    <span className={`text-xs ${typeConfig.color}`}>{typeConfig.label}</span>
                  </div>
                  <p className="text-sm text-[#A7ACBF] mb-2 line-clamp-2">{event.message}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#4F46E5]">${event.cost.toFixed(2)}</span>
                    <span className="text-[#A7ACBF]">
                      {new Date(event.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            {events.length === 0 && <p className="text-sm text-[#A7ACBF]">No activity yet.</p>}
          </div>
        </div>
      </div>

      <div className="data-card p-5">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/agents" className="btn-primary text-sm">
            <Bot className="w-4 h-4 inline mr-2" />
            Register Agent
          </Link>
          <Link to="/inbox" className="btn-secondary text-sm">
            <Inbox className="w-4 h-4 inline mr-2" />
            Review Approvals
          </Link>
          <Link to="/spend" className="btn-secondary text-sm">
            <DollarSign className="w-4 h-4 inline mr-2" />
            View Spend
          </Link>
        </div>
      </div>
    </div>
  );
}

