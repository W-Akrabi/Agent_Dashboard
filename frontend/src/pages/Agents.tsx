import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Bot,
  Plus,
  Play,
  Pause,
  AlertCircle,
  Clock,
  Inbox,
  Search,
} from 'lucide-react';
import { CopiedIcon } from '@/components/ui/animated-state-icons';
import type { Agent } from '@/types/index';
import { createAgent, getAgents, updateAgentStatus } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const statusConfig = {
  online: { color: 'text-green-400', bg: 'bg-green-400/10', icon: Activity, label: 'Online' },
  idle: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Clock, label: 'Idle' },
  offline: { color: 'text-[#A7ACBF]', bg: 'bg-white/5', icon: Pause, label: 'Offline' },
  running: { color: 'text-green-400', bg: 'bg-green-400/10', icon: Play, label: 'Running' },
  paused: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Pause, label: 'Paused' },
  error: { color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertCircle, label: 'Error' },
  waiting_approval: { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Inbox, label: 'Waiting' },
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState('');
  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentDescription, setNewAgentDescription] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connectTab, setConnectTab] = useState('claude-code');
  const [copiedConnect, setCopiedConnect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = async () => {
    try {
      setError(null);
      const response = await getAgents();
      setAgents(response);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load agents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.description?.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) return;

    try {
      setError(null);
      const response = await createAgent({
        name: newAgentName.trim(),
        description: newAgentDescription.trim() || undefined,
      });
      setAgents((prev) => [response.agent, ...prev]);
      setGeneratedToken(response.agentToken);
    } catch (createError) {
      console.error(createError);
      setError(createError instanceof Error ? createError.message : 'Failed to create agent.');
    }
  };

  const copyToken = () => {
    if (generatedToken) {
      void navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

  const copyConnect = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedConnect(true);
    window.setTimeout(() => setCopiedConnect(false), 2000);
  };

  const resetModal = () => {
    setNewAgentName('');
    setNewAgentDescription('');
    setGeneratedToken(null);
    setCopied(false);
    setConnectTab('claude-code');
    setCopiedConnect(false);
    setShowNewAgentModal(false);
  };

  if (isLoading) {
    return (
      <div className="data-card p-8 text-center">
        <p className="text-[#A7ACBF]">Loading agents...</p>
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Your Agents</h2>
        <Dialog open={showNewAgentModal} onOpenChange={setShowNewAgentModal}>
          <DialogTrigger asChild>
            <button className="btn-primary text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Register Agent
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#0B0E16] border-white/10 text-white max-w-xl">
            <DialogHeader>
              <DialogTitle>{generatedToken ? 'Agent Created' : 'Register New Agent'}</DialogTitle>
            </DialogHeader>

            {generatedToken ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-green-400/10 border border-green-400/30">
                  <p className="text-sm text-green-400 mb-1">Agent created successfully!</p>
                  <p className="text-xs text-[#A7ACBF]">Save your token — you won&apos;t be able to see it again.</p>
                </div>

                <div>
                  <p className="text-xs text-[#A7ACBF] mb-1 font-medium uppercase tracking-wider">Agent Token</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-white/5 rounded-lg text-xs font-mono break-all">{generatedToken}</code>
                    <button onClick={copyToken} className="flex items-center gap-1 px-3 py-2 bg-brand rounded-lg hover:bg-brand-hover transition-colors text-xs text-white whitespace-nowrap">
                      <CopiedIcon size={14} color="white" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#A7ACBF] mb-2 font-medium uppercase tracking-wider">Connect Your Agent</p>
                  <div className="flex border-b border-white/10 overflow-x-auto mb-3">
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
                        className={`px-2.5 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${connectTab === tab.id ? 'border-brand text-white' : 'border-transparent text-[#A7ACBF] hover:text-white'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {connectTab === 'claude-code' && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#A7ACBF]">One command — no installation required:</p>
                      <code className="block p-3 bg-white/5 rounded-lg text-xs font-mono break-all">{`claude mcp add --transport http jarvis "${apiBaseUrl}/mcp?token=${generatedToken}"`}</code>
                      <button onClick={() => copyConnect(`claude mcp add --transport http jarvis "${apiBaseUrl}/mcp?token=${generatedToken}"`)} className="flex items-center gap-1 px-3 py-1.5 bg-brand rounded-lg hover:bg-brand-hover transition-colors text-xs text-white">
                        <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy command'}
                      </button>
                    </div>
                  )}
                  {connectTab === 'codex' && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#A7ACBF]">One command — no installation required:</p>
                      <code className="block p-3 bg-white/5 rounded-lg text-xs font-mono break-all">{`codex mcp add --transport http jarvis "${apiBaseUrl}/mcp?token=${generatedToken}"`}</code>
                      <button onClick={() => copyConnect(`codex mcp add --transport http jarvis "${apiBaseUrl}/mcp?token=${generatedToken}"`)} className="flex items-center gap-1 px-3 py-1.5 bg-brand rounded-lg hover:bg-brand-hover transition-colors text-xs text-white">
                        <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy command'}
                      </button>
                    </div>
                  )}
                  {connectTab === 'n8n' && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#A7ACBF]">Paste the URL into n8n, Make.com, or Zapier and add the header below:</p>
                      <code className="block p-3 bg-white/5 rounded-lg text-xs font-mono break-all">{`${apiBaseUrl}/v1/webhook`}</code>
                      <p className="text-xs text-[#A7ACBF]">Add a custom HTTP header:</p>
                      <code className="block p-3 bg-white/5 rounded-lg text-xs font-mono break-all">{`X-Agent-Token: ${generatedToken}`}</code>
                      <button onClick={() => copyConnect(`${apiBaseUrl}/v1/webhook`)} className="flex items-center gap-1 px-3 py-1.5 bg-brand rounded-lg hover:bg-brand-hover transition-colors text-xs text-white">
                        <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy URL'}
                      </button>
                    </div>
                  )}
                  {connectTab === 'python' && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#A7ACBF]">Install and connect:</p>
                      <code className="block p-2 bg-white/5 rounded-lg text-xs font-mono">pip install jarvis-mc</code>
                      <code className="block p-3 bg-white/5 rounded-lg text-xs font-mono whitespace-pre-wrap">{`from jarvis_mc import JarvisAgent\n\nagent = JarvisAgent(\n    token="${generatedToken}",\n    base_url="${apiBaseUrl}"\n)\nagent.log("Agent started")`}</code>
                      <button onClick={() => copyConnect(`from jarvis_mc import JarvisAgent\n\nagent = JarvisAgent(\n    token="${generatedToken}",\n    base_url="${apiBaseUrl}"\n)\nagent.log("Agent started")`)} className="flex items-center gap-1 px-3 py-1.5 bg-brand rounded-lg hover:bg-brand-hover transition-colors text-xs text-white">
                        <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy code'}
                      </button>
                    </div>
                  )}
                  {connectTab === 'openai' && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#A7ACBF]">Add Jarvis hooks to your OpenAI Agents setup:</p>
                      <code className="block p-3 bg-white/5 rounded-lg text-xs font-mono whitespace-pre-wrap">{`from jarvis_mc.integrations import JarvisHooks\n\nhooks = JarvisHooks(\n    token="${generatedToken}",\n    base_url="${apiBaseUrl}"\n)\n# Pass hooks= to your Agent constructor`}</code>
                      <button onClick={() => copyConnect(`from jarvis_mc.integrations import JarvisHooks\n\nhooks = JarvisHooks(\n    token="${generatedToken}",\n    base_url="${apiBaseUrl}"\n)\n# Pass hooks= to your Agent constructor`)} className="flex items-center gap-1 px-3 py-1.5 bg-brand rounded-lg hover:bg-brand-hover transition-colors text-xs text-white">
                        <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy code'}
                      </button>
                    </div>
                  )}
                  {connectTab === 'other' && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#A7ACBF]">POST from any language or environment:</p>
                      <code className="block p-3 bg-white/5 rounded-lg text-xs font-mono whitespace-pre-wrap">{`curl -X POST ${apiBaseUrl}/v1/webhook \\\n  -H "Content-Type: application/json" \\\n  -H "X-Agent-Token: ${generatedToken}" \\\n  -d '{"type":"action","message":"Hello from my agent"}'`}</code>
                      <button onClick={() => copyConnect(`curl -X POST ${apiBaseUrl}/v1/webhook -H "Content-Type: application/json" -H "X-Agent-Token: ${generatedToken}" -d '{"type":"action","message":"Hello from my agent"}'`)} className="flex items-center gap-1 px-3 py-1.5 bg-brand rounded-lg hover:bg-brand-hover transition-colors text-xs text-white">
                        <CopiedIcon size={14} color="white" />{copiedConnect ? 'Copied!' : 'Copy command'}
                      </button>
                    </div>
                  )}
                </div>

                <button onClick={resetModal} className="w-full btn-primary">Done</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#A7ACBF] mb-2">Agent Name</label>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={(event) => setNewAgentName(event.target.value)}
                    placeholder="e.g., Research Assistant"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#A7ACBF] mb-2">Description (optional)</label>
                  <textarea
                    value={newAgentDescription}
                    onChange={(event) => setNewAgentDescription(event.target.value)}
                    placeholder="What does this agent do?"
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand resize-none"
                  />
                </div>
                <button
                  onClick={() => void handleCreateAgent()}
                  disabled={!newAgentName.trim()}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Agent
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A7ACBF]" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search agents..."
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => {
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
                    <h3 className="font-medium">{agent.name}</h3>
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

              {agent.description && <p className="text-sm text-[#A7ACBF] mb-4 line-clamp-2">{agent.description}</p>}

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-[#A7ACBF] text-xs mb-1">Total Spend</p>
                  <p className="font-mono">${agent.totalSpend.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[#A7ACBF] text-xs mb-1">Events</p>
                  <p className="font-mono">{agent.eventsCount}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A7ACBF]">
                  Last seen: {new Date(agent.lastSeen).toLocaleDateString()}
                </span>
                <Link to={`/agents/${agent.id}`} className="text-xs text-brand hover:underline">
                  Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="data-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-brand" />
          </div>
          <h3 className="text-lg font-medium mb-2">No agents found</h3>
          <p className="text-[#A7ACBF] mb-4">Try adjusting your search or create a new agent.</p>
          <button onClick={() => setShowNewAgentModal(true)} className="btn-primary">
            Register Agent
          </button>
        </div>
      )}
    </div>
  );
}

