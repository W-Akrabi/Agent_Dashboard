export type TabId =
    | 'dashboard'
    | 'inbox'
    | 'workshop'
    | 'spend'
    | 'scheduler'
    | 'comms'
    | 'sleep'
    | 'memory'
    | 'key-vault'
    | 'ingest-api';

export interface NavItem {
    id: TabId;
    label: string;
    icon: string;
}

export interface Activity {
    time: string;
    agent: string;
    msg: string;
}

export interface KanbanCard {
    title: string;
    agent: string;
}

export interface KanbanColumn {
    id: string;
    label: string;
    cards: KanbanCard[];
}

export interface AgentSpend {
    name: string;
    amount: string;
}

export interface SchedulerJob {
    id: string;
    name: string;
    webhook: string;
    nextRun: string;
    cron: string;
    enabled: boolean;
}

export interface AutomationRule {
    id: string;
    condition: string;
    action: string;
    enabled: boolean;
}

export interface ChatMessage {
    id: string;
    sender: 'agent' | 'human';
    name: string;
    text: string;
    time: string;
}

export interface MemoryEntry {
    id: string;
    tag: string;
    content: string;
    addedBy: string;
    addedWhen: string;
}

export interface VaultKey {
    id: string;
    label: string;
    value: string;
}

// ── New PRD types ────────────────────────────────────────────────

export type AgentStatus = 'running' | 'idle' | 'waiting_approval' | 'error' | 'paused';

export interface Agent {
    id: string;
    name: string;
    status: AgentStatus;
    totalSpend: number;
    lastSeen: string;
    tokenHash: string;
    eventsCount: number;
}

export interface AgentEvent {
    id: string;
    agentId: string;
    type: 'task_start' | 'task_complete' | 'info' | 'approval_req' | 'error';
    message: string;
    cost: number;
    createdAt: string;
}

export type InboxItemStatus = 'pending' | 'approved' | 'rejected';

export interface InboxItem {
    id: string;
    agentId: string;
    agentName: string;
    completed: string;
    proposedAction: string;
    status: InboxItemStatus;
    createdAt: string;
    comment?: string;
}
