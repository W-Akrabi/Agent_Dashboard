import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
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
  DollarSign,
  Activity,
} from 'lucide-react';
import { CopiedIcon } from '@/components/ui/animated-state-icons';
import type { Agent, AgentEvent } from '@/types/index';
import { getAgent, getAgentEvents, revokeAgentToken, updateAgentStatus } from '@/lib/api';
import { useInvalidation } from '@/contexts/InvalidationContext';
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
  const { subscribe } = useInvalidation();
  const [agent, setAgent] = useState<Agent | undefined>(undefined);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connectTab, setConnectTab] = useState('claude-code');
  const [copiedConnect, setCopiedConnect] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) {
      setError('Missing agent id.');
      setIsLoading(false);
      return;
    }
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
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubEvents = subscribe('events', () => { void loadData(); });
    const unsubAgents = subscribe('agents', () => { void loadData(); });
    return () => {
      unsubEvents();
      unsubAgents();
    };
  }, [subscribe, loadData]);

  // SSE — primary real-time channel; polling via InvalidationContext is the fallback
  useEffect(() => {
    if (!id) return;
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    const connect = async () => {
      if (!mounted) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !mounted) return;
      es = new EventSource(`${apiBase}/v1/stream/events?agent_id=${id}&token=${session.access_token}`);
      es.onmessage = () => { void loadData(); };
      es.onerror = () => {
        es?.close();
        es = null;
        if (mounted) retryTimer = setTimeout(() => { void connect(); }, 5000);
      };
    };

    void connect();
    return () => {
      mounted = false;
      es?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [id, loadData]);

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

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

  const copyConnect = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedConnect(true);
    window.setTimeout(() => setCopiedConnect(false), 2000);
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
          <h3 className="font-semibold">Connect</h3>
          <div className="flex items-center gap-2 text-xs text-[#A7ACBF]">
            <span>Token:</span>
            <code className="font-mono">{agent.tokenHash}</code>
          </div>
        </div>

        <div className="flex border-b border-white/10 overflow-x-auto mb-4">
          {[
            { id: 'claude-code', label: 'Claude Code' },
            { id: 'codex', label: 'Codex' },
            { id: 'n8n', label: 'n8n / Make' },
            { id: 'python', label: 'Python' },
            { id: 'openai', label: 'OpenAI Agents' },
            { id: 'other', label: 'HTTP' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setConnectTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${connectTab === tab.id ? 'border-[#4F46E5] text-white' : 'border-transparent text-[#A7ACBF] hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {connectTab === 'claude-code' && (
          <div className="space-y-2">
            <p className="text-xs text-[#A7ACBF]">Step 1 — install the MCP server:</p>
            <code className="block p-2 bg-white/5 rounded-lg text-sm font-mono">pip install jarvis-mc-mcp</code>
            <p className="text-xs text-[#A7ACBF]">Step 2 — register with Claude Code (replace &lt;your-token&gt;):</p>
            <code className="block p-3 bg-white/5 rounded-lg text-sm font-mono whitespace-pre-wrap">{`claude mcp add jarvis \\\n  -e JARVIS_TOKEN=<your-token> \\\n  -e JARVIS_URL=${apiBaseUrl} \\\n  -- jarvis-mcp`}</code>
            <button onClick={() => copyConnect(`claude mcp add jarvis -e JARVIS_TOKEN=<your-token> -e JARVIS_URL=${apiBaseUrl} -- jarvis-mcp`)} className="flex items-center gap-1 px-3 py-1.5 bg-[#4F46E5] rounded-lg hover:bg-[#4338CA] transition-colors text-xs text-white">
              <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy command'}
            </button>
          </div>
        )}
        {connectTab === 'codex' && (
          <div className="space-y-2">
            <p className="text-xs text-[#A7ACBF]">Step 1 — install the MCP server:</p>
            <code className="block p-2 bg-white/5 rounded-lg text-sm font-mono">pip install jarvis-mc-mcp</code>
            <p className="text-xs text-[#A7ACBF]">Step 2 — register with Codex (replace &lt;your-token&gt;):</p>
            <code className="block p-3 bg-white/5 rounded-lg text-sm font-mono whitespace-pre-wrap">{`codex mcp add jarvis \\\n  --env JARVIS_TOKEN=<your-token> \\\n  --env JARVIS_URL=${apiBaseUrl} \\\n  -- jarvis-mcp`}</code>
            <button onClick={() => copyConnect(`codex mcp add jarvis --env JARVIS_TOKEN=<your-token> --env JARVIS_URL=${apiBaseUrl} -- jarvis-mcp`)} className="flex items-center gap-1 px-3 py-1.5 bg-[#4F46E5] rounded-lg hover:bg-[#4338CA] transition-colors text-xs text-white">
              <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy command'}
            </button>
          </div>
        )}
        {connectTab === 'n8n' && (
          <div className="space-y-2">
            <p className="text-xs text-[#A7ACBF]">Paste into n8n, Make.com, or Zapier — no headers needed:</p>
            <code className="block p-3 bg-white/5 rounded-lg text-sm font-mono break-all">{`${apiBaseUrl}/v1/webhook/<your-token>`}</code>
            <button onClick={() => copyConnect(`${apiBaseUrl}/v1/webhook/<your-token>`)} className="flex items-center gap-1 px-3 py-1.5 bg-[#4F46E5] rounded-lg hover:bg-[#4338CA] transition-colors text-xs text-white">
              <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        )}
        {connectTab === 'python' && (
          <div className="space-y-2">
            <p className="text-xs text-[#A7ACBF]">Install and connect:</p>
            <code className="block p-2 bg-white/5 rounded-lg text-sm font-mono">pip install jarvis-mc</code>
            <code className="block p-3 bg-white/5 rounded-lg text-sm font-mono whitespace-pre-wrap">{`from jarvis_mc import JarvisAgent\n\nagent = JarvisAgent(\n    token="<your-token>",\n    base_url="${apiBaseUrl}"\n)\nagent.log("Agent started")`}</code>
            <button onClick={() => copyConnect(`from jarvis_mc import JarvisAgent\n\nagent = JarvisAgent(\n    token="<your-token>",\n    base_url="${apiBaseUrl}"\n)\nagent.log("Agent started")`)} className="flex items-center gap-1 px-3 py-1.5 bg-[#4F46E5] rounded-lg hover:bg-[#4338CA] transition-colors text-xs text-white">
              <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy code'}
            </button>
          </div>
        )}
        {connectTab === 'openai' && (
          <div className="space-y-2">
            <p className="text-xs text-[#A7ACBF]">Add Jarvis hooks to your OpenAI Agents setup:</p>
            <code className="block p-3 bg-white/5 rounded-lg text-sm font-mono whitespace-pre-wrap">{`from jarvis_mc.integrations import JarvisHooks\n\nhooks = JarvisHooks(\n    token="<your-token>",\n    base_url="${apiBaseUrl}"\n)\n# Pass hooks= to your Agent constructor`}</code>
            <button onClick={() => copyConnect(`from jarvis_mc.integrations import JarvisHooks\n\nhooks = JarvisHooks(\n    token="<your-token>",\n    base_url="${apiBaseUrl}"\n)\n# Pass hooks= to your Agent constructor`)} className="flex items-center gap-1 px-3 py-1.5 bg-[#4F46E5] rounded-lg hover:bg-[#4338CA] transition-colors text-xs text-white">
              <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy code'}
            </button>
          </div>
        )}
        {connectTab === 'other' && (
          <div className="space-y-2">
            <p className="text-xs text-[#A7ACBF]">POST from any language or environment:</p>
            <code className="block p-3 bg-white/5 rounded-lg text-sm font-mono whitespace-pre-wrap">{`curl -X POST ${apiBaseUrl}/v1/webhook/<your-token> \\\n  -H "Content-Type: application/json" \\\n  -d '{"type":"action","message":"Hello from my agent"}'`}</code>
            <button onClick={() => copyConnect(`curl -X POST ${apiBaseUrl}/v1/webhook/<your-token> -H "Content-Type: application/json" -d '{"type":"action","message":"Hello from my agent"}'`)} className="flex items-center gap-1 px-3 py-1.5 bg-[#4F46E5] rounded-lg hover:bg-[#4338CA] transition-colors text-xs text-white">
              <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy command'}
            </button>
          </div>
        )}
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

