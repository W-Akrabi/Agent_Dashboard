import type { Agent, AgentEvent, InboxItem, SpendData } from '@/types/index';

export const mockAgents: Agent[] = [
  {
    id: 'agent-001',
    name: 'Research Assistant',
    status: 'running',
    totalSpend: 124.50,
    lastSeen: '2026-02-27T14:32:00Z',
    tokenHash: 'tok_...a7f3',
    eventsCount: 342,
    description: 'Web research and document summarization agent',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'agent-002',
    name: 'Code Reviewer',
    status: 'idle',
    totalSpend: 89.25,
    lastSeen: '2026-02-27T12:15:00Z',
    tokenHash: 'tok_...b8g4',
    eventsCount: 156,
    description: 'Automated code review and suggestion agent',
    createdAt: '2026-01-20T14:30:00Z',
  },
  {
    id: 'agent-003',
    name: 'Data Processor',
    status: 'waiting_approval',
    totalSpend: 245.80,
    lastSeen: '2026-02-27T14:45:00Z',
    tokenHash: 'tok_...c9h5',
    eventsCount: 892,
    description: 'ETL pipeline and data transformation agent',
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'agent-004',
    name: 'Customer Support',
    status: 'running',
    totalSpend: 67.30,
    lastSeen: '2026-02-27T14:50:00Z',
    tokenHash: 'tok_...d0i6',
    eventsCount: 523,
    description: 'Customer inquiry handling and routing agent',
    createdAt: '2026-02-05T11:00:00Z',
  },
  {
    id: 'agent-005',
    name: 'Content Generator',
    status: 'paused',
    totalSpend: 178.90,
    lastSeen: '2026-02-26T18:20:00Z',
    tokenHash: 'tok_...e1j7',
    eventsCount: 234,
    description: 'Marketing content and copy generation agent',
    createdAt: '2026-02-10T16:45:00Z',
  },
  {
    id: 'agent-006',
    name: 'Test Runner',
    status: 'error',
    totalSpend: 45.60,
    lastSeen: '2026-02-27T10:05:00Z',
    tokenHash: 'tok_...f2k8',
    eventsCount: 78,
    description: 'Automated testing and QA agent',
    createdAt: '2026-02-15T13:20:00Z',
  },
];

export const mockEvents: AgentEvent[] = [
  {
    id: 'evt-001',
    agentId: 'agent-001',
    type: 'tool_call',
    message: 'Searched web for "AI agent orchestration best practices"',
    cost: 0.02,
    createdAt: '2026-02-27T14:32:00Z',
  },
  {
    id: 'evt-002',
    agentId: 'agent-003',
    type: 'approval_request',
    message: 'Requesting approval to process 10,000 customer records',
    cost: 0.01,
    createdAt: '2026-02-27T14:45:00Z',
  },
  {
    id: 'evt-003',
    agentId: 'agent-004',
    type: 'completion',
    message: 'Resolved support ticket #4521',
    cost: 0.05,
    createdAt: '2026-02-27T14:50:00Z',
  },
  {
    id: 'evt-004',
    agentId: 'agent-002',
    type: 'action',
    message: 'Analyzed PR #234 for code quality',
    cost: 0.03,
    createdAt: '2026-02-27T14:28:00Z',
  },
  {
    id: 'evt-005',
    agentId: 'agent-006',
    type: 'error',
    message: 'Test suite failed: Connection timeout to test database',
    cost: 0.01,
    createdAt: '2026-02-27T10:05:00Z',
  },
  {
    id: 'evt-006',
    agentId: 'agent-001',
    type: 'completion',
    message: 'Generated summary report on agent frameworks',
    cost: 0.08,
    createdAt: '2026-02-27T14:25:00Z',
  },
  {
    id: 'evt-007',
    agentId: 'agent-004',
    type: 'tool_call',
    message: 'Retrieved customer history from CRM',
    cost: 0.02,
    createdAt: '2026-02-27T14:48:00Z',
  },
  {
    id: 'evt-008',
    agentId: 'agent-003',
    type: 'action',
    message: 'Validating data schema for batch job',
    cost: 0.04,
    createdAt: '2026-02-27T14:40:00Z',
  },
];

export const mockInboxItems: InboxItem[] = [
  {
    id: 'inbox-001',
    agentId: 'agent-003',
    agentName: 'Data Processor',
    proposedAction: 'Process 10,000 customer records from production database',
    completedActions: [
      'Validated data schema',
      'Checked API rate limits',
      'Prepared transformation pipeline',
    ],
    status: 'pending',
    createdAt: '2026-02-27T14:45:00Z',
  },
  {
    id: 'inbox-002',
    agentId: 'agent-001',
    agentName: 'Research Assistant',
    proposedAction: 'Execute 50 web searches for competitive analysis report',
    completedActions: [
      'Identified target competitors',
      'Prepared search queries',
    ],
    status: 'pending',
    createdAt: '2026-02-27T14:30:00Z',
  },
  {
    id: 'inbox-003',
    agentId: 'agent-005',
    agentName: 'Content Generator',
    proposedAction: 'Generate 20 blog post variations using GPT-4',
    completedActions: [
      'Analyzed brand voice guidelines',
      'Prepared content briefs',
    ],
    status: 'approved',
    comment: 'Approved, but keep costs under $50',
    createdAt: '2026-02-27T13:15:00Z',
  },
  {
    id: 'inbox-004',
    agentId: 'agent-002',
    agentName: 'Code Reviewer',
    proposedAction: 'Auto-merge approved PRs to main branch',
    completedActions: [
      'Reviewed 5 pending PRs',
      'All checks passed',
    ],
    status: 'rejected',
    comment: 'Manual review required for main branch',
    createdAt: '2026-02-27T12:00:00Z',
  },
];

export const mockSpendData: SpendData = {
  daily: 12.45,
  monthly: 751.35,
  budget: 1000,
  agentBreakdown: [
    { agentId: 'agent-003', agentName: 'Data Processor', spend: 245.80 },
    { agentId: 'agent-005', agentName: 'Content Generator', spend: 178.90 },
    { agentId: 'agent-001', agentName: 'Research Assistant', spend: 124.50 },
    { agentId: 'agent-002', agentName: 'Code Reviewer', spend: 89.25 },
    { agentId: 'agent-004', agentName: 'Customer Support', spend: 67.30 },
    { agentId: 'agent-006', agentName: 'Test Runner', spend: 45.60 },
  ],
};

export const getAgentEvents = (agentId: string): AgentEvent[] => {
  return mockEvents
    .filter((e) => e.agentId === agentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getAgentById = (agentId: string): Agent | undefined => {
  return mockAgents.find((a) => a.id === agentId);
};

export const getPendingApprovalsCount = (): number => {
  return mockInboxItems.filter((i) => i.status === 'pending').length;
};
