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
