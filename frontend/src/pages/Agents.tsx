import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
  running: { color: 'text-green-400', bg: 'bg-green-400/10', icon: Play, label: 'Running' },
  idle: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Clock, label: 'Idle' },
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

  const resetModal = () => {
    setNewAgentName('');
    setNewAgentDescription('');
    setGeneratedToken(null);
    setCopied(false);
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
          <DialogContent className="bg-[#0B0E16] border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>{generatedToken ? 'Agent Created' : 'Register New Agent'}</DialogTitle>
            </DialogHeader>

            {generatedToken ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-400/10 border border-green-400/30">
                  <p className="text-sm text-green-400 mb-2">Agent created successfully!</p>
                  <p className="text-xs text-[#A7ACBF]">
                    Copy this token now. You won&apos;t be able to see it again.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-white/5 rounded-lg text-sm font-mono break-all">
                    {generatedToken}
                  </code>
                  <button
                    onClick={copyToken}
                    className="p-3 bg-[#4F46E5] rounded-lg hover:bg-[#4338CA] transition-colors"
                  >
                    <CopiedIcon size={20} color="white" />
                  </button>
                </div>
                <button onClick={resetModal} className="w-full btn-primary">
                  Done
                </button>
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
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#A7ACBF] mb-2">Description (optional)</label>
                  <textarea
                    value={newAgentDescription}
                    onChange={(event) => setNewAgentDescription(event.target.value)}
                    placeholder="What does this agent do?"
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#4F46E5] resize-none"
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
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#4F46E5]"
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
                <Link to={`/agents/${agent.id}`} className="text-xs text-[#4F46E5] hover:underline">
                  Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="data-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#4F46E5]/20 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-[#4F46E5]" />
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

