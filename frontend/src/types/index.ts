export interface Agent {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'paused' | 'error' | 'waiting_approval';
  totalSpend: number;
  lastSeen: string;
  tokenHash: string;
  eventsCount: number;
  description?: string;
  createdAt: string;
}

export interface AgentEvent {
  id: string;
  agentId: string;
  type: 'action' | 'completion' | 'error' | 'tool_call' | 'approval_request';
  message: string;
  cost: number;
  createdAt: string;
}

export interface InboxItem {
  id: string;
  agentId: string;
  agentName: string;
  proposedAction: string;
  completedActions: string[];
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  monthlyBudget: number;
}

export interface SpendData {
  daily: number;
  monthly: number;
  budget: number;
  agentBreakdown: {
    agentId: string;
    agentName: string;
    spend: number;
  }[];
}

export type NavItem = {
  label: string;
  path: string;
  icon: string;
  badge?: number;
};

// ── Workshop ──────────────────────────────────────────────────────────────────

export type WorkshopTaskStatus = 'backlog' | 'in_progress' | 'done';

export interface WorkshopTask {
  id: string;
  workspaceId: string;
  agentId: string | null;
  agentName: string | null;
  title: string;
  description: string | null;
  status: WorkshopTaskStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Comms Hub ────────────────────────────────────────────────────────────────

export type CommsMessageStatus = 'queued' | 'delivered' | 'responded';
export type CommsSender = 'human' | 'agent' | 'system';

export interface CommsAgentSummary {
  agentId: string;
  agentName: string;
  agentStatus: Agent['status'];
  lastMessage: string | null;
  lastMessageAt: string | null;
  queuedCount: number;
  pendingApprovalCount: number;
}

export interface CommsMessage {
  id: string;
  agentId: string;
  sender: CommsSender;
  content: string;
  messageStatus: CommsMessageStatus;
  replyToMessageId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  deliveredAt: string | null;
  respondedAt: string | null;
}
