import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCommsAgents, getCommsMessages, getSseToken, sendCommsMessage } from '@/lib/api';
import { useInvalidation } from '@/contexts/InvalidationContext';
import type { CommsAgentSummary, CommsMessage } from '@/types';

const _API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(iso: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

const STATUS_DOT: Record<string, string> = {
  running: 'bg-emerald-400',
  idle: 'bg-[#A7ACBF]',
  paused: 'bg-amber-400',
  error: 'bg-red-400',
  waiting_approval: 'bg-purple-400',
};

const MSG_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  queued: { label: 'Queued', color: 'text-amber-400' },
  delivered: { label: 'Delivered', color: 'text-sky-400' },
  responded: { label: 'Responded', color: 'text-emerald-400' },
};

// ── AgentListItem ─────────────────────────────────────────────────────────────

function AgentListItem({
  summary,
  selected,
  onClick,
}: {
  summary: CommsAgentSummary;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
        selected
          ? 'bg-brand/20 border border-brand/40'
          : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`shrink-0 h-2 w-2 rounded-full ${STATUS_DOT[summary.agentStatus] ?? 'bg-[#A7ACBF]'}`}
          />
          <span className="text-sm font-medium text-[#F4F6FF] truncate">{summary.agentName}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {summary.queuedCount > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
              {summary.queuedCount}
            </span>
          )}
          {summary.pendingApprovalCount > 0 && (
            <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400">
              !
            </span>
          )}
        </div>
      </div>
      {summary.lastMessage && (
        <p className="mt-0.5 pl-4 text-[11px] text-[#7D8293] truncate">{summary.lastMessage}</p>
      )}
      {summary.lastMessageAt && (
        <p className="mt-0.5 pl-4 text-[10px] text-[#555870]">{formatRelative(summary.lastMessageAt)}</p>
      )}
    </button>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: CommsMessage }) {
  const isHuman = msg.sender === 'human';
  const statusInfo = MSG_STATUS_LABEL[msg.messageStatus];
  const cost = typeof msg.metadata?.cost === 'number' ? (msg.metadata.cost as number) : null;
  const model = typeof msg.metadata?.model === 'string' ? (msg.metadata.model as string) : null;

  return (
    <article
      className={`flex flex-col max-w-[80%] ${isHuman ? 'ml-auto items-end' : 'mr-auto items-start'}`}
    >
      <div
        className={`rounded-xl border px-4 py-3 ${
          isHuman
            ? 'border-brand/40 bg-brand/15 text-[#E0DDFF]'
            : 'border-white/10 bg-[#05060B]/80 text-[#F4F6FF]'
        }`}
      >
        <p className="text-[11px] font-semibold mb-1 text-[#A7ACBF]">
          {isHuman ? 'You' : msg.agentId.slice(0, 8)}
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
      </div>
      <div className="mt-1 flex items-center gap-2 px-1">
        <span className="text-[10px] text-[#555870]">{formatTime(msg.createdAt)}</span>
        {isHuman && statusInfo && (
          <span className={`text-[10px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        )}
        {cost !== null && (
          <span className="text-[10px] text-[#555870]">${cost.toFixed(4)}</span>
        )}
        {model && (
          <span className="text-[10px] text-[#555870] font-mono">{model}</span>
        )}
      </div>
    </article>
  );
}

// ── ApprovalBanner ────────────────────────────────────────────────────────────

function ApprovalBanner({ agentName }: { agentName: string }) {
  return (
    <div className="mx-4 mt-3 flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
        <p className="text-xs text-purple-300">
          <span className="font-semibold">{agentName}</span> has pending approval requests
        </p>
      </div>
      <Link
        to="/inbox"
        className="text-xs font-medium text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
      >
        Review in Inbox →
      </Link>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const CommsHub: React.FC = () => {
  const { subscribe } = useInvalidation();

  const [agents, setAgents] = useState<CommsAgentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CommsMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Optimistic messages queued locally before server confirms
  const [optimisticMsgs, setOptimisticMsgs] = useState<CommsMessage[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedAgent = agents.find(a => a.agentId === selectedId) ?? null;

  // ── fetch agents ───────────────────────────────────────────────────────────

  const fetchAgents = useCallback(async () => {
    try {
      const data = await getCommsAgents();
      setAgents(data);
      setSelectedId(prev => {
        if (prev && data.some(a => a.agentId === prev)) return prev;
        return data[0]?.agentId ?? null;
      });
    } catch {
      // silently keep previous list
    } finally {
      setLoadingAgents(false);
    }
  }, []);

  useEffect(() => {
    void fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    return subscribe('comms', () => { void fetchAgents(); });
  }, [subscribe, fetchAgents]);

  useEffect(() => {
    return subscribe('agents', () => { void fetchAgents(); });
  }, [subscribe, fetchAgents]);

  // SSE — primary real-time channel; polling via InvalidationContext is the fallback
  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    const connect = async () => {
      if (!mounted) return;
      let sseToken: string;
      try { sseToken = await getSseToken(); } catch { return; }
      if (!mounted) return;
      es = new EventSource(`${_API_BASE}/v1/stream/comms?token=${sseToken}`);
      es.onmessage = () => { void fetchAgents(); };
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
  }, [fetchAgents]);

  // ── fetch messages for selected agent ─────────────────────────────────────

  const fetchMessages = useCallback(async (agentId: string) => {
    setLoadingMessages(true);
    try {
      const data = await getCommsMessages(agentId, { limit: 100 });
      setMessages(data);
      setOptimisticMsgs([]);
    } catch {
      // keep previous
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    void fetchMessages(selectedId);
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    if (!selectedId) return;
    return subscribe('comms', () => { void fetchMessages(selectedId); });
  }, [selectedId, subscribe, fetchMessages]);

  // SSE for message thread of selected agent
  useEffect(() => {
    if (!selectedId) return;
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    const connect = async () => {
      if (!mounted) return;
      let sseToken: string;
      try { sseToken = await getSseToken(); } catch { return; }
      if (!mounted) return;
      es = new EventSource(`${_API_BASE}/v1/stream/comms?token=${sseToken}`);
      es.onmessage = () => { void fetchMessages(selectedId); };
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
  }, [selectedId, fetchMessages]);

  // ── auto-scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, optimisticMsgs]);

  // ── send ───────────────────────────────────────────────────────────────────

  const send = async () => {
    const content = input.trim();
    if (!content || !selectedId || sending) return;

    setSendError(null);
    setInput('');

    // Optimistic bubble
    const tempId = `optimistic-${Date.now()}`;
    const optimistic: CommsMessage = {
      id: tempId,
      agentId: selectedId,
      sender: 'human',
      content,
      messageStatus: 'queued',
      replyToMessageId: null,
      metadata: {},
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      respondedAt: null,
    };
    setOptimisticMsgs(prev => [...prev, optimistic]);
    setSending(true);

    try {
      await sendCommsMessage(selectedId, { content });
      // Server message will arrive via invalidation; clear optimistic
      setOptimisticMsgs(prev => prev.filter(m => m.id !== tempId));
      void fetchMessages(selectedId);
      void fetchAgents();
    } catch (err) {
      setOptimisticMsgs(prev => prev.filter(m => m.id !== tempId));
      setSendError(err instanceof Error ? err.message : 'Failed to send');
      setInput(content); // restore so user can retry
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  // ── combined timeline ──────────────────────────────────────────────────────

  const serverIds = new Set(messages.map(m => m.id));
  const timeline = [
    ...messages,
    ...optimisticMsgs.filter(m => !serverIds.has(m.id)),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Comms Hub</h2>
        <p className="mt-1 text-sm text-[#A7ACBF]">
          Persistent per-agent chat. Messages queue even when agents are offline.
        </p>
      </header>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[480px]">
        {/* ── Left pane: agent list ── */}
        <aside className="w-64 shrink-0 flex flex-col rounded-xl border border-white/10 bg-[#0B0E16]/80 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs font-semibold text-[#A7ACBF] uppercase tracking-wider">Agents</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingAgents ? (
              <div className="flex items-center justify-center h-24">
                <span className="text-xs text-[#7D8293]">Loading…</span>
              </div>
            ) : agents.length === 0 ? (
              <p className="px-2 py-4 text-xs text-center text-[#7D8293]">No agents yet</p>
            ) : (
              agents.map(a => (
                <AgentListItem
                  key={a.agentId}
                  summary={a}
                  selected={a.agentId === selectedId}
                  onClick={() => setSelectedId(a.agentId)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Right pane: thread ── */}
        <div className="flex-1 flex flex-col rounded-xl border border-white/10 bg-[#0B0E16]/80 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm overflow-hidden">
          {/* thread header */}
          {selectedAgent && (
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${STATUS_DOT[selectedAgent.agentStatus] ?? 'bg-[#A7ACBF]'}`}
              />
              <div>
                <p className="text-sm font-semibold text-[#F4F6FF]">{selectedAgent.agentName}</p>
                <p className="text-[11px] text-[#7D8293] capitalize">{selectedAgent.agentStatus.replace('_', ' ')}</p>
              </div>
            </div>
          )}

          {/* approval banner */}
          {selectedAgent && selectedAgent.pendingApprovalCount > 0 && (
            <ApprovalBanner agentName={selectedAgent.agentName} />
          )}

          {/* messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {!selectedId ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-[#7D8293]">Select an agent to view conversation</p>
              </div>
            ) : loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-xs text-[#7D8293]">Loading messages…</span>
              </div>
            ) : timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <p className="text-sm text-[#7D8293]">No messages yet</p>
                <p className="text-xs text-[#555870]">Send a message to start the conversation</p>
              </div>
            ) : (
              timeline.map(msg => <MessageBubble key={msg.id} msg={msg} />)
            )}
            <div ref={bottomRef} />
          </div>

          {/* error */}
          {sendError && (
            <div className="mx-5 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
              <p className="text-xs text-red-400">{sendError}</p>
            </div>
          )}

          {/* composer */}
          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={2}
                placeholder={
                  selectedId
                    ? 'Message agent… (Enter to send, Shift+Enter for newline)'
                    : 'Select an agent first'
                }
                value={input}
                disabled={!selectedId || sending}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                className="flex-1 resize-none rounded-lg border border-white/10 bg-[#05060B]/70 px-3 py-2.5 text-sm text-[#F4F6FF] placeholder:text-[#7D8293] focus:border-brand/70 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => { void send(); }}
                disabled={!input.trim() || !selectedId || sending}
                className="h-[52px] rounded-lg bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? '…' : 'Send'}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-[#555870]">
              Messages queue and deliver when the agent polls for commands.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
