import type {
    NavItem, Activity, KanbanColumn, MomentumTask,
    AgentSpend, SchedulerJob, AutomationRule, ChatMessage,
    MemoryEntry, VaultKey
} from './types';
import type { Agent, InboxItem, AgentEvent } from './types';

export const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'inbox', label: 'Inbox', icon: '📥' },
    { id: 'workshop', label: 'Workshop', icon: '📋' },
    { id: 'momentum', label: 'Momentum', icon: '🔥' },
    { id: 'spend', label: 'API Spend', icon: '💸' },
    { id: 'scheduler', label: 'Scheduler', icon: '⏱️' },
    { id: 'multi-agent', label: 'Multi-Agent', icon: '🕸️' },
    { id: 'comms', label: 'Comms Hub', icon: '💬' },
    { id: 'sleep', label: 'Sleep Mode', icon: '🌙' },
    { id: 'fix-ui', label: 'Fix UI', icon: '🖼️' },
    { id: 'memory', label: 'Memory', icon: '🧠' },
    { id: 'key-vault', label: 'Key Vault', icon: '🔐' },
    { id: 'ingest-api', label: 'The Glue', icon: '🔌' },
];

export const MOCK_AGENTS: Agent[] = [
    {
        id: 'agt-001',
        name: 'Research Agent',
        status: 'running',
        totalSpend: 18.20,
        lastSeen: '2 minutes ago',
        tokenHash: 'sk-jmc-••••••••••••••••••••••••••ra01',
        eventsCount: 142,
    },
    {
        id: 'agt-002',
        name: 'Writer Agent',
        status: 'waiting_approval',
        totalSpend: 12.50,
        lastSeen: '5 minutes ago',
        tokenHash: 'sk-jmc-••••••••••••••••••••••••••wa02',
        eventsCount: 87,
    },
    {
        id: 'agt-003',
        name: 'Data Bot',
        status: 'idle',
        totalSpend: 8.40,
        lastSeen: '1 hour ago',
        tokenHash: 'sk-jmc-••••••••••••••••••••••••••db03',
        eventsCount: 56,
    },
    {
        id: 'agt-004',
        name: 'QA Agent',
        status: 'error',
        totalSpend: 3.40,
        lastSeen: '3 hours ago',
        tokenHash: 'sk-jmc-••••••••••••••••••••••••••qa04',
        eventsCount: 23,
    },
];

export const MOCK_AGENT_EVENTS: AgentEvent[] = [
    { id: 'ev-001', agentId: 'agt-001', type: 'task_start', message: 'Starting competitor research for Acme Corp', cost: 0.012, createdAt: '14:01:03' },
    { id: 'ev-002', agentId: 'agt-001', type: 'task_complete', message: 'Pulled 12 sources from the web', cost: 0.045, createdAt: '14:02:18' },
    { id: 'ev-003', agentId: 'agt-001', type: 'info', message: 'Synthesizing results into structured report', cost: 0.031, createdAt: '14:03:44' },
    { id: 'ev-004', agentId: 'agt-002', type: 'task_start', message: 'Beginning draft of Acme competitor analysis', cost: 0.009, createdAt: '13:55:11' },
    { id: 'ev-005', agentId: 'agt-002', type: 'approval_req', message: 'Draft ready. Proposed next: Publish to Notion', cost: 0.02, createdAt: '13:58:00' },
    { id: 'ev-006', agentId: 'agt-003', type: 'task_complete', message: 'Monthly financial summary exported to CSV', cost: 0.007, createdAt: '12:30:00' },
    { id: 'ev-007', agentId: 'agt-004', type: 'error', message: 'Timeout: Puppeteer session crashed on checkout page', cost: 0, createdAt: '11:00:00' },
];

export const MOCK_INBOX: InboxItem[] = [
    {
        id: 'task-001',
        agentId: 'agt-002',
        agentName: 'Writer Agent',
        completed: 'Drafted competitor analysis for Acme Corp (1,850 words).',
        proposedAction: 'Publish draft to Notion workspace under "Competitive Intelligence"',
        status: 'pending',
        createdAt: '13:58 PM',
    },
    {
        id: 'task-002',
        agentId: 'agt-001',
        agentName: 'Research Agent',
        completed: 'Scraped 40 LinkedIn profiles matching ICP criteria.',
        proposedAction: 'Enrich and export to HubSpot CRM via API',
        status: 'pending',
        createdAt: '11:30 AM',
    },
    {
        id: 'task-003',
        agentId: 'agt-003',
        agentName: 'Data Bot',
        completed: 'Identified 7 duplicate transactions in October books.',
        proposedAction: 'Delete duplicates and notify Finance Agent',
        status: 'pending',
        createdAt: 'Yesterday',
    },
];

export const ACTIVITIES: Activity[] = [
    { time: 'Just now', agent: 'Writer Agent', msg: 'Started drafting weekly report.' },
    { time: '2m ago', agent: 'Research Agent', msg: 'Found 3 new articles on AI trends.' },
    { time: '15m ago', agent: 'Sales Bot', msg: 'Sent follow-up email to Acme Corp.' },
    { time: '1h ago', agent: 'Orchestrator', msg: 'Spawned Data Analysis sub-agent.' },
    { time: '2h ago', agent: 'QA Agent', msg: 'Flagged UI issue on checkout page.' },
];

export const KANBAN_COLUMNS: KanbanColumn[] = [
    {
        id: 'backlog', label: 'Backlog',
        cards: [
            { title: 'Analyze competitor pricing', agent: 'Research Agent' },
            { title: 'Update monthly invoice templates', agent: 'Finance Agent' },
        ],
    },
    {
        id: 'progress', label: 'In Progress',
        cards: [{ title: 'Drafting blog post on AI', agent: 'Writer Agent' }],
    },
    {
        id: 'approval', label: 'Awaiting Approval',
        cards: [
            { title: 'Send final email blast', agent: 'Marketing Agent' },
            { title: 'Deploy hotfix to prod', agent: 'DevOps Agent' },
        ],
    },
    {
        id: 'done', label: 'Done',
        cards: [{ title: 'Scrape newest leads', agent: 'Sales Bot' }],
    },
];

export const MOMENTUM_TASKS: MomentumTask[] = [
    { rank: 1, title: 'Prevent churn for Acme Corp', reason: 'Account usage dropped 80% this week. Highly likely to cancel.', priority: 'Critical', priorityClass: 'priority-critical' },
    { rank: 2, title: 'Review Q3 Marketing Spend', reason: 'Ad campaigns are running 25% over budget in the last 48 hours.', priority: 'High', priorityClass: 'priority-high' },
    { rank: 3, title: 'Approve new pricing page copy', reason: 'Blocks Writer Agent from publishing to staging.', priority: 'High', priorityClass: 'priority-high' },
    { rank: 4, title: 'Categorize unknown transactions', reason: 'Finance Agent needs human input to close out monthly books.', priority: 'Medium', priorityClass: 'priority-medium' },
];

export const AGENT_SPEND: AgentSpend[] = [
    { name: 'Research Agent', amount: '$18.20' },
    { name: 'Writer Agent', amount: '$12.50' },
    { name: 'Data Bot', amount: '$8.40' },
    { name: 'Others', amount: '$3.40' },
];

export const SCHEDULER_JOBS: SchedulerJob[] = [
    { id: 'j1', name: 'Weekly Report Start', webhook: '/api/agents/orchestrator/start', nextRun: 'Monday 9:00 AM', cron: '0 9 * * 1', enabled: true },
    { id: 'j2', name: 'Nightly Backup', webhook: '/api/agents/db-agent/dump', nextRun: 'Daily 2:00 AM', cron: '0 2 * * *', enabled: true },
];

export const AUTOMATION_RULES: AutomationRule[] = [
    { id: 'r1', condition: 'Daily Spend > $50', action: 'Pause non-critical agents', enabled: true },
    { id: 'r2', condition: 'Time between 00:00 – 06:00', action: 'Set Low Power Mode', enabled: true },
];

export const CHAT_MESSAGES: ChatMessage[] = [
    { id: 'm1', sender: 'agent', name: 'Research Agent', text: 'I have compiled the top 5 competitors for Acme Corp. Should I send this to Writer Agent?', time: '10:42 AM' },
    { id: 'm2', sender: 'human', name: 'You', text: 'Yes, but focus strictly on their pricing models.', time: '10:45 AM' },
    { id: 'm3', sender: 'agent', name: 'Research Agent', text: 'Understood. Forwarding to Writer Agent with constraint: pricing models.', time: '10:46 AM' },
];

export const MEMORY_ENTRIES: MemoryEntry[] = [
    { id: 'mem1', tag: 'Brand Voice', content: '"Always output copy in a professional but approachable tone, avoiding enterprise jargon."', addedBy: 'User', addedWhen: '2 days ago' },
    { id: 'mem2', tag: 'API Keys', content: 'Anthropic Key rotated on Oct 12. Rate limits upgraded to Tier 4.', addedBy: 'System', addedWhen: '1 week ago' },
];

export const VAULT_KEYS: VaultKey[] = [
    { id: 'k1', label: 'OpenAI API Key', value: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    { id: 'k2', label: 'Anthropic API Key', value: 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
];

export const BAR_DATA = [
    { day: 'Mon', pct: 40 },
    { day: 'Tue', pct: 60 },
    { day: 'Wed', pct: 85 },
    { day: 'Thu', pct: 50 },
    { day: 'Fri', pct: 90 },
    { day: 'Sat', pct: 30 },
    { day: 'Sun', pct: 75, active: true },
];
