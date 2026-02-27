import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Bot,
  Play,
  Pause,
  AlertCircle,
  Clock,
  Inbox,
  ArrowLeft,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  DollarSign,
  Activity,
} from 'lucide-react';
import type { Agent, AgentEvent } from '@/types/index';
import { getAgent, getAgentEvents, revokeAgentToken, updateAgentStatus } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | undefined>(undefined);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [copied, setCopied] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Missing agent id.');
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setError(null);
        const [agentResponse, eventsResponse] = await Promise.all([getAgent(id), getAgentEvents(id)]);
        setAgent(agentResponse);
        setEvents(eventsResponse);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load agent details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="data-card p-8 text-center">
        <p className="text-[#A7ACBF]">Loading agent...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="data-card p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-red-400/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-medium mb-2">Agent not found</h3>
        <p className="text-[#A7ACBF] mb-4">{error || "The agent you're looking for doesn't exist."}</p>
        <Link to="/agents" className="btn-primary">
          Back to Agents
        </Link>
      </div>
    );
  }

  const status = statusConfig[agent.status];
  const StatusIcon = status.icon;

  const toggleStatus = async () => {
    const newStatus: Agent['status'] = agent.status === 'running' ? 'paused' : 'running';
    try {
      const updated = await updateAgentStatus(agent.id, newStatus);
      setAgent(updated);
    } catch (toggleError) {
      console.error(toggleError);
      setError(toggleError instanceof Error ? toggleError.message : 'Failed to update status.');
    }
  };

  const copyToken = () => {
    void navigator.clipboard.writeText(agent.tokenHash);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    try {
      await revokeAgentToken(agent.id);
      setShowRevokeDialog(false);
      navigate('/agents');
    } catch (revokeError) {
      console.error(revokeError);
      setError(revokeError instanceof Error ? revokeError.message : 'Failed to revoke token.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <Link to="/agents" className="inline-flex items-center gap-2 text-[#A7ACBF] hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Agents
      </Link>

      <div className="data-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl ${status.bg} flex items-center justify-center`}>
              <Bot className={`w-8 h-8 ${status.color}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-sm ${status.color} flex items-center gap-1`}>
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </span>
                <span className="text-sm text-[#A7ACBF]">
                  Created {new Date(agent.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void toggleStatus()}
              className={`btn-primary flex items-center gap-2 ${agent.status === 'running' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
            >
              {agent.status === 'running' ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Resume
                </>
              )}
            </button>
            <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
              <DialogTrigger asChild>
                <button className="btn-secondary flex items-center gap-2 text-red-400 border-red-400/30 hover:bg-red-400/10">
                  <Trash2 className="w-4 h-4" /> Revoke Token
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#0B0E16] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Revoke Agent Token</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-[#A7ACBF]">
                    Are you sure you want to revoke the token for <strong>{agent.name}</strong>?
                  </p>
                  <p className="text-sm text-[#A7ACBF]">
                    This will immediately stop the agent from accessing the API. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => void handleRevoke()} className="flex-1 btn-primary bg-red-500 hover:bg-red-600">
                      Revoke Token
                    </button>
                    <button onClick={() => setShowRevokeDialog(false)} className="flex-1 btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {agent.description && <p className="mt-4 text-[#A7ACBF]">{agent.description}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Total Spend</span>
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#4F46E5]" />
            </div>
          </div>
          <p className="text-2xl font-bold">${agent.totalSpend.toFixed(2)}</p>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Events</span>
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#4F46E5]" />
            </div>
          </div>
          <p className="text-2xl font-bold">{agent.eventsCount}</p>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Last Seen</span>
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#4F46E5]" />
            </div>
          </div>
          <p className="text-lg font-bold">
            {new Date(agent.lastSeen).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Agent ID</span>
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#4F46E5]" />
            </div>
          </div>
          <p className="text-lg font-mono">{agent.id}</p>
        </div>
      </div>

      <div className="data-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Agent Token</h3>
          <button onClick={copyToken} className="flex items-center gap-2 text-sm text-[#4F46E5] hover:underline">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <code className="block p-4 bg-white/5 rounded-lg text-sm font-mono break-all">{agent.tokenHash}</code>
        <p className="mt-2 text-xs text-[#A7ACBF]">
          Stored token values are masked for safety. Keep the original token from registration for agent auth.
        </p>
      </div>

      <div className="data-card p-6">
        <h3 className="font-semibold mb-4">Event History</h3>

        {events.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-[#A7ACBF] mx-auto mb-2" />
            <p className="text-[#A7ACBF]">No events yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {events.map((event) => {
              const typeConfig = eventTypeConfig[event.type];

              return (
                <div key={event.id} className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${typeConfig.color}`}>{typeConfig.label}</span>
                    <span className="text-xs text-[#A7ACBF]">{new Date(event.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-[#A7ACBF] mb-2">{event.message}</p>
                  <span className="text-xs font-mono text-[#4F46E5]">${event.cost.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

