import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronRight, ChevronLeft, Plus, Trash2, X } from 'lucide-react';
import {
  createWorkshopTask,
  deleteWorkshopTask,
  getAgents,
  getWorkshopTasks,
  updateWorkshopTask,
} from '@/lib/api';
import { useInvalidation } from '@/contexts/InvalidationContext';
import type { Agent, WorkshopTask, WorkshopTaskStatus } from '@/types/index';

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS: {
  id: WorkshopTaskStatus;
  label: string;
  next: WorkshopTaskStatus | null;
  prev: WorkshopTaskStatus | null;
}[] = [
  { id: 'backlog',     label: 'Backlog',     next: 'in_progress', prev: null          },
  { id: 'in_progress', label: 'In Progress', next: 'done',        prev: 'backlog'     },
  { id: 'done',        label: 'Done',        next: null,          prev: 'in_progress' },
];

const COLUMN_STYLES: Record<WorkshopTaskStatus, { header: string; badge: string }> = {
  backlog:     { header: 'border-brand/30', badge: 'bg-brand/15 text-[#D6D3FF]' },
  in_progress: { header: 'border-amber-500/30', badge: 'bg-amber-500/15 text-amber-300' },
  done:        { header: 'border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-300' },
};

// ── AddTaskModal ──────────────────────────────────────────────────────────────

function AddTaskModal({
  agents,
  onClose,
  onCreated,
}: {
  agents: Agent[];
  onClose: () => void;
  onCreated: (task: WorkshopTask) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const task = await createWorkshopTask({
        title: title.trim(),
        description: description.trim() || undefined,
        agentId: agentId || null,
      });
      onCreated(task);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0B0E16] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">New Task</h3>
          <button onClick={onClose} className="text-[#A7ACBF] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => { void submit(e); }} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A7ACBF] mb-1.5">Title *</label>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full rounded-lg border border-white/10 bg-[#05060B]/70 px-3 py-2.5 text-sm text-[#F4F6FF] placeholder:text-[#555870] focus:border-brand/70 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A7ACBF] mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
              className="w-full resize-none rounded-lg border border-white/10 bg-[#05060B]/70 px-3 py-2.5 text-sm text-[#F4F6FF] placeholder:text-[#555870] focus:border-brand/70 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A7ACBF] mb-1.5">Assign to agent</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#05060B]/70 px-3 py-2.5 text-sm text-[#F4F6FF] focus:border-brand/70 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-[#A7ACBF] hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  col,
  onMove,
  onDelete,
}: {
  task: WorkshopTask;
  col: (typeof COLUMNS)[number];
  onMove: (taskId: string, newStatus: WorkshopTaskStatus) => void;
  onDelete: (taskId: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteWorkshopTask(task.id);
      onDelete(task.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="group rounded-lg border border-white/10 bg-[#05060B]/80 p-3 space-y-2.5 hover:border-white/20 transition-colors">
      <p className="text-sm font-medium text-[#F4F6FF] leading-snug">{task.title}</p>

      {task.description && (
        <p className="text-[11px] text-[#7D8293] line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        {task.agentName ? (
          <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-medium text-[#D6D3FF] min-w-0">
            <Bot className="w-3 h-3 shrink-0" />
            <span className="truncate">{task.agentName}</span>
          </span>
        ) : (
          <span className="text-[10px] text-[#555870]">Unassigned</span>
        )}
        <span className="text-[10px] text-[#555870] shrink-0">
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Move / delete actions */}
      <div className="flex items-center justify-between pt-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          {col.prev && (
            <button
              onClick={() => onMove(task.id, col.prev!)}
              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-[#A7ACBF] hover:bg-white/10 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              {COLUMNS.find((c) => c.id === col.prev)?.label}
            </button>
          )}
          {col.next && (
            <button
              onClick={() => onMove(task.id, col.next!)}
              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-[#A7ACBF] hover:bg-white/10 hover:text-white transition-colors"
            >
              {COLUMNS.find((c) => c.id === col.next)?.label}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          onClick={() => { void handleDelete(); }}
          disabled={deleting}
          className="rounded p-1 text-[#555870] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const Workshop: React.FC = () => {
  const { subscribe } = useInvalidation();
  const [tasks, setTasks] = useState<WorkshopTask[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [tasksData, agentsData] = await Promise.all([getWorkshopTasks(), getAgents()]);
      setTasks(tasksData);
      setAgents(agentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workshop.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => subscribe('workshop', () => { void loadData(); }), [subscribe, loadData]);
  useEffect(() => subscribe('agents', () => { void loadData(); }), [subscribe, loadData]);

  const columns = useMemo(
    () => COLUMNS.map((col) => ({ col, tasks: tasks.filter((t) => t.status === col.id) })),
    [tasks],
  );

  const handleMove = async (taskId: string, newStatus: WorkshopTaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await updateWorkshopTask(taskId, { status: newStatus });
    } catch {
      void loadData(); // revert on failure
    }
  };

  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCreated = (task: WorkshopTask) => {
    setTasks((prev) => [...prev, task]);
    setShowAddModal(false);
  };

  if (isLoading) {
    return (
      <div className="data-card p-8 text-center">
        <p className="text-[#A7ACBF]">Loading workshop…</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Workshop</h2>
          <p className="mt-1 text-sm text-[#A7ACBF]">
            Define tasks for your agents — they pick up from Backlog and move through to Done.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-light transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </header>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map(({ col, tasks: colTasks }) => {
          const styles = COLUMN_STYLES[col.id];
          return (
            <article
              key={col.id}
              className="flex flex-col rounded-xl border border-white/10 bg-[#0B0E16]/80 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm overflow-hidden"
            >
              <div className={`px-4 py-3 border-b ${styles.header}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles.badge}`}>
                    {colTasks.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[140px] max-h-[calc(100vh-300px)]">
                {colTasks.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[#555870]">
                    {col.id === 'backlog' ? 'Add a task to get started' : 'Nothing here yet'}
                  </p>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      col={col}
                      onMove={(id, s) => { void handleMove(id, s); }}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-xs text-[#555870]">
        {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
        {' · '}agents use{' '}
        <code className="font-mono text-[#7D8293]">GET /v1/workshop/my-tasks</code>{' '}
        to fetch their queue
      </p>

      {showAddModal && (
        <AddTaskModal
          agents={agents}
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </section>
  );
};
