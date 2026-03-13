import { Link } from 'react-router-dom';
import { Terminal, Code, Bot, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';

const sections = [
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'mcp', label: 'MCP Server' },
  { id: 'python-sdk', label: 'Python SDK' },
  { id: 'http-api', label: 'HTTP API' },
  { id: 'events', label: 'Event Types' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'comms-hub', label: 'Comms Hub' },
  { id: 'disconnecting', label: 'Disconnecting' },
];

export default function DocsPage() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-[240px_1fr] gap-12">
          {/* Sidebar nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs text-[#A7ACBF] uppercase tracking-widest mb-4">Documentation</p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#A7ACBF] hover:text-white hover:bg-white/5 transition-colors"
                >
                  {s.label}
                </a>
              ))}
              <div className="pt-4 border-t border-white/5 mt-4">
                <Link
                  to="/auth"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-brand hover:underline"
                >
                  Open dashboard <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#A7ACBF] hover:text-white transition-colors"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="space-y-20 min-w-0">
            {/* Title */}
            <div>
              <span className="eyebrow text-brand mb-4 block">Documentation</span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Jarvis Mission Control</h1>
              <p className="text-[#A7ACBF] text-lg">
                Everything you need to connect your agents, stream events, gate approvals, and track spend.
              </p>
            </div>

            {/* Quick Start */}
            <section id="quickstart">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-brand" />
                </div>
                <h2 className="text-2xl font-bold">Quick Start</h2>
              </div>
              <p className="text-[#A7ACBF] mb-6">
                Get from zero to streaming events in under 5 minutes.
              </p>

              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    title: 'Create an account',
                    desc: 'Sign up at jarvisctl.io. No credit card required.',
                    code: null,
                  },
                  {
                    step: '2',
                    title: 'Register an agent',
                    desc: 'Go to Agents → Register Agent. Give it a name and click Create. You\'ll see a one-time agent token — copy it now.',
                    code: null,
                  },
                  {
                    step: '3',
                    title: 'Send your first event',
                    desc: 'Use any of the methods below. Your event will appear in the dashboard within seconds.',
                    code: `# Option A: direct HTTP (curl)
curl -X POST https://your-instance.com/v1/events \\
  -H "X-Agent-Token: jmc_your_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"action","message":"Hello from my agent","cost":0}'`,
                  },
                ].map((item) => (
                  <div key={item.step} className="data-card p-6">
                    <div className="flex gap-4">
                      <span className="text-2xl font-bold text-brand/40 font-mono shrink-0 w-6">
                        {item.step}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{item.title}</h3>
                        <p className="text-sm text-[#A7ACBF] mb-3">{item.desc}</p>
                        {item.code && (
                          <pre className="text-xs font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">
                            {item.code}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* MCP Server */}
            <section id="mcp">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-brand" />
                </div>
                <h2 className="text-2xl font-bold">MCP Server</h2>
              </div>
              <p className="text-[#A7ACBF] mb-6">
                The Jarvis MCP server exposes four tools —{' '}
                <code className="text-brand bg-white/5 px-1.5 rounded">log_action</code>,{' '}
                <code className="text-brand bg-white/5 px-1.5 rounded">request_approval</code>,{' '}
                <code className="text-brand bg-white/5 px-1.5 rounded">fetch_human_messages</code>, and{' '}
                <code className="text-brand bg-white/5 px-1.5 rounded">send_human_reply</code> —
                to any MCP-compatible agent: Claude Code, Codex CLI, Cursor, Windsurf, or custom agents
                using the OpenAI Agents SDK.
              </p>

              <div className="space-y-6">
                <div className="data-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-brand" />
                    Claude Code
                  </h3>
                  <p className="text-xs text-[#A7ACBF] mb-3">One command — no installation required. Find your token on the Agent Detail page.</p>
                  <pre className="text-sm font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">{`claude mcp add --transport http jarvis "https://your-instance.com/mcp?token=<your-agent-token>"`}</pre>
                  <p className="text-xs text-[#A7ACBF] mt-3">
                    Claude will now have access to <code className="text-brand">log_action</code>,{' '}
                    <code className="text-brand">request_approval</code>,{' '}
                    <code className="text-brand">fetch_human_messages</code>,{' '}
                    <code className="text-brand">send_human_reply</code>,{' '}
                    <code className="text-brand">get_workshop_tasks</code>, and{' '}
                    <code className="text-brand">update_workshop_task_status</code> tools.
                  </p>
                </div>

                <div className="data-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-brand" />
                    Codex CLI
                  </h3>
                  <p className="text-xs text-[#A7ACBF] mb-3">One command — no installation required.</p>
                  <pre className="text-sm font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">{`codex mcp add --transport http jarvis "https://your-instance.com/mcp?token=<your-agent-token>"`}</pre>
                </div>

                <div className="data-card p-6">
                  <h3 className="font-semibold mb-4">settings.json (Cursor / Windsurf)</h3>
                  <pre className="text-sm font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">{`{
  "mcpServers": {
    "jarvis": {
      "type": "http",
      "url": "https://your-instance.com/mcp?token=<your-agent-token>"
    }
  }
}`}</pre>
                </div>

                <div className="data-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Code className="w-4 h-4 text-brand" />
                    OpenAI Agents SDK
                  </h3>
                  <pre className="text-sm font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">{`from agents.mcp import MCPServerHTTP

jarvis = MCPServerHTTP(
    url="https://your-instance.com/mcp?token=<your-agent-token>"
)
agent = Agent(mcp_servers=[jarvis])`}</pre>
                </div>
              </div>
            </section>

            {/* Python SDK */}
            <section id="python-sdk">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Code className="w-4 h-4 text-brand" />
                </div>
                <h2 className="text-2xl font-bold">Python SDK</h2>
              </div>
              <p className="text-[#A7ACBF] mb-6">
                For agents built directly in Python — without MCP.
              </p>

              <div className="space-y-6">
                <div className="data-card p-6">
                  <h3 className="font-semibold mb-3">Installation</h3>
                  <pre className="text-sm font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 whitespace-pre">pip install jarvis-mc</pre>
                </div>

                <div className="data-card p-6">
                  <h3 className="font-semibold mb-4">Basic usage</h3>
                  <pre className="text-sm font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">{`from jarvis_mc import JarvisAgent

agent = JarvisAgent(
    token="<your-agent-token>",
    base_url="https://your-instance.com"
)

# Log an action
agent.log("Started analysis", type="action")

# Log a tool call with cost
agent.log("Called GPT-4o", type="tool_call", cost=0.0085)

# Log a completion
agent.log("Analysis complete", type="completion", cost=0.02)

# Log an error
agent.log("Rate limit hit", type="error")`}</pre>
                </div>

                <div className="data-card p-6">
                  <h3 className="font-semibold mb-4">Request approval</h3>
                  <pre className="text-sm font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">{`decision = agent.request_approval(
    message="Fetched 312 subscribers, validated emails",
    proposed_action="Send marketing email to all 312 recipients",
    completed_actions=[
        "Fetched 312 subscriber records",
        "Validated all email addresses"
    ],
    timeout_minutes=10
)

if decision["approved"]:
    send_emails()
else:
    print("Rejected:", decision.get("comment"))`}</pre>
                </div>

                <div className="data-card p-6">
                  <h3 className="font-semibold mb-4">OpenAI Agents integration</h3>
                  <pre className="text-sm font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">{`from jarvis_mc.integrations import JarvisHooks

hooks = JarvisHooks(
    token="<your-agent-token>",
    base_url="https://your-instance.com"
)

# Pass to your OpenAI Agent constructor
agent = Agent(
    name="my-agent",
    hooks=hooks,
    ...
)`}</pre>
                </div>
              </div>
            </section>

            {/* HTTP API */}
            <section id="http-api">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-brand" />
                </div>
                <h2 className="text-2xl font-bold">HTTP API</h2>
              </div>
              <p className="text-[#A7ACBF] mb-6">
                Any language, any framework. If it can make an HTTP request, it can connect to Jarvis.
              </p>

              <div className="space-y-4">
                {[
                  {
                    method: 'POST',
                    path: '/v1/events',
                    desc: 'Log an event from your agent.',
                    auth: 'X-Agent-Token header',
                    body: `{
  "type": "action",          // required: action | tool_call | completion | error | approval_request
  "message": "string",       // required: what the agent did
  "cost": 0.0,               // optional: USD cost (default 0)
  "requiresApproval": false, // optional: set true to trigger approval flow
  "proposedAction": "string",// optional: shown in inbox if requiresApproval is true
  "completedActions": []     // optional: context for the approver
}`,
                    response: `{
  "event": { "id": "evt_...", "type": "action", ... },
  "taskId": "task_..."   // present if requiresApproval is true
}`,
                  },
                  {
                    method: 'GET',
                    path: '/v1/commands',
                    desc: 'Poll for pending commands (approval decisions) for your agent.',
                    auth: 'X-Agent-Token header',
                    body: null,
                    response: `[
  {
    "id": "cmd_...",
    "kind": "approval_decision",
    "status": "pending",
    "payload": {
      "decision": "approved",
      "comment": "LGTM"
    }
  }
]`,
                  },
                  {
                    method: 'POST',
                    path: '/v1/commands/{id}/ack',
                    desc: 'Acknowledge a command after reading it. Marks it as processed.',
                    auth: 'X-Agent-Token header',
                    body: null,
                    response: `{ "ok": true }`,
                  },
                  {
                    method: 'POST',
                    path: '/v1/webhook',
                    desc: 'Webhook endpoint for n8n, Make.com, Zapier, or any HTTP client. Pass the agent token in the X-Agent-Token header.',
                    auth: 'X-Agent-Token header',
                    body: `{ "type": "action", "message": "Hello", "cost": 0 }`,
                    response: `{ "ok": true }`,
                  },
                ].map((endpoint) => (
                  <div key={endpoint.path} className="data-card p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        endpoint.method === 'GET' ? 'bg-green-400/15 text-green-400' : 'bg-blue-400/15 text-blue-400'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-[#F4F6FF]">{endpoint.path}</code>
                    </div>
                    <p className="text-sm text-[#A7ACBF] mb-3">{endpoint.desc}</p>
                    <p className="text-xs text-[#A7ACBF] mb-3">
                      <span className="text-white">Auth:</span> {endpoint.auth}
                    </p>
                    {endpoint.body && (
                      <div className="mb-3">
                        <p className="text-xs text-[#A7ACBF] mb-1">Request body</p>
                        <pre className="text-xs font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-3 overflow-x-auto whitespace-pre">
                          {endpoint.body}
                        </pre>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-[#A7ACBF] mb-1">Response</p>
                      <pre className="text-xs font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-3 overflow-x-auto whitespace-pre">
                        {endpoint.response}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Event Types reference */}
            <section id="events">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-brand" />
                </div>
                <h2 className="text-2xl font-bold">Event Types</h2>
              </div>

              <div className="data-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-6 text-[#A7ACBF] font-medium">Type</th>
                      <th className="text-left py-3 px-6 text-[#A7ACBF] font-medium">Colour</th>
                      <th className="text-left py-3 px-6 text-[#A7ACBF] font-medium">When to use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { type: 'action', color: 'blue-400', use: 'A significant step or milestone. Use sparingly — not for every file read.' },
                      { type: 'tool_call', color: 'purple-400', use: 'A specific tool invocation (write_file, bash, web_search). Include cost.' },
                      { type: 'completion', color: 'green-400', use: 'A task or sub-task finished successfully.' },
                      { type: 'error', color: 'red-400', use: 'Something went wrong. Surfaces with red highlight in the feed.' },
                      { type: 'approval_request', color: 'orange-400', use: 'The agent needs human sign-off. Triggers the approval inbox.' },
                    ].map((row, i) => (
                      <tr key={row.type} className={i % 2 === 0 ? 'bg-white/[0.01]' : ''}>
                        <td className="py-3 px-6">
                          <code className="text-sm font-mono text-brand">{row.type}</code>
                        </td>
                        <td className="py-3 px-6">
                          <span className={`text-${row.color} text-sm`}>{row.color.replace('-400', '')}</span>
                        </td>
                        <td className="py-3 px-6 text-[#A7ACBF]">{row.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Approvals reference */}
            <section id="approvals">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-brand" />
                </div>
                <h2 className="text-2xl font-bold">Approvals</h2>
              </div>
              <p className="text-[#A7ACBF] mb-6">
                The approval flow lets you gate any action behind a human decision. The agent halts,
                you approve or reject from the inbox, and the decision is polled by the agent.
              </p>

              <div className="space-y-4">
                <div className="data-card p-6">
                  <h3 className="font-semibold mb-3">1. Request approval</h3>
                  <pre className="text-sm font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">{`# Via MCP (recommended for Claude Code / Codex)
request_approval(
  message="Context for the reviewer",
  proposed_action="The action you want to take",
  completed_actions=["Step 1 done", "Step 2 done"],
  timeout_minutes=5
)

# Via HTTP
POST /v1/events
{
  "type": "approval_request",
  "message": "Context for the reviewer",
  "requiresApproval": true,
  "proposedAction": "The action you want to take",
  "completedActions": ["Step 1 done", "Step 2 done"]
}`}</pre>
                </div>

                <div className="data-card p-6">
                  <h3 className="font-semibold mb-3">2. Poll for the decision</h3>
                  <p className="text-sm text-[#A7ACBF] mb-3">
                    Poll <code className="text-brand">GET /v1/commands</code> every 3 seconds.
                    When a decision arrives, acknowledge it with{' '}
                    <code className="text-brand">POST /v1/commands/{'{id}'}/ack</code>.
                  </p>
                  <div className="space-y-2">
                    {[
                      'The MCP server handles polling automatically — the agent just awaits the tool call result',
                      'The Python SDK\'s request_approval() also handles polling internally',
                      'If using HTTP directly, implement the polling loop yourself (3s interval recommended)',
                      'Unacknowledged commands are returned on every poll until acknowledged',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                        <span className="text-[#A7ACBF]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Comms Hub */}
            <section id="comms-hub">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-brand" />
                </div>
                <h2 className="text-2xl font-bold">Comms Hub</h2>
              </div>
              <p className="text-[#A7ACBF] mb-6">
                The Comms Hub gives you a persistent, per-agent chat channel — like a direct line into each agent's work.
                Messages queue even when the agent is offline or paused. Agents poll for them via the standard commands
                endpoint and reply via <code className="text-brand bg-white/5 px-1.5 rounded">POST /v1/comms/replies</code>.
              </p>

              <div className="space-y-6">
                {/* Data flow */}
                <div className="data-card p-6">
                  <h3 className="font-semibold mb-4">Data flow</h3>
                  <div className="space-y-2">
                    {[
                      'User sends a message in the Comms Hub UI',
                      'Backend writes a comms_messages row (sender=human, status=queued)',
                      'Backend creates a commands row (kind=human_message) linking to the message',
                      'Agent polls GET /v1/commands, finds human_message commands',
                      'Agent does its work and replies via POST /v1/comms/replies',
                      'Agent acks the command via POST /v1/commands/{id}/ack',
                      'Backend marks message delivered on ack, responded on reply',
                      'Frontend updates in real-time via Supabase postgres_changes',
                    ].map((step, i) => (
                      <div key={step} className="flex items-start gap-3 text-sm">
                        <span className="text-brand/60 font-mono shrink-0 w-4">{i + 1}.</span>
                        <span className="text-[#A7ACBF]">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Python SDK */}
                <div className="data-card p-6">
                  <h3 className="font-semibold mb-3">Python SDK — Comms helpers</h3>
                  <pre className="text-xs font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">{`from jarvis_mc import JarvisAgent

agent = JarvisAgent(token="jmc_your_token")

# Option A: poll-and-reply loop
while True:
    for cmd in agent.get_human_messages():
        user_text = cmd["payload"]["content"]
        # ... do work ...
        agent.respond_to_human_command(cmd, f"Done: {result}")
    time.sleep(10)

# Option B: reply + ack manually
msgs = agent.get_human_messages()
if msgs:
    cmd = msgs[0]
    agent.reply(
        content="Working on it!",
        reply_to_message_id=cmd["payload"]["messageId"],
        metadata={"cost": 0.012, "model": "claude-sonnet-4-6"},
    )
    agent.ack(cmd["id"])`}</pre>
                </div>

                {/* MCP tools */}
                <div className="data-card p-6">
                  <h3 className="font-semibold mb-3">MCP tools</h3>
                  <p className="text-sm text-[#A7ACBF] mb-4">
                    Two optional tools are available for agents that communicate via MCP:
                  </p>
                  <div className="space-y-4">
                    {[
                      {
                        name: 'fetch_human_messages',
                        desc: 'Returns all pending human messages from the Comms Hub. Use at the start of a work loop.',
                      },
                      {
                        name: 'send_human_reply',
                        desc: 'Posts a reply and acks the source command. Accepts content, command_id, reply_to_message_id, cost, model.',
                      },
                    ].map((tool) => (
                      <div key={tool.name}>
                        <code className="text-sm text-brand bg-white/5 px-2 py-1 rounded">{tool.name}</code>
                        <p className="text-sm text-[#A7ACBF] mt-1">{tool.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API reference */}
                <div className="data-card p-6">
                  <h3 className="font-semibold mb-3">HTTP API reference</h3>
                  <div className="space-y-3 font-mono text-xs">
                    {[
                      { method: 'GET', path: '/v1/comms/agents', auth: 'user', desc: 'Per-agent summaries: last message, queued count, pending approvals' },
                      { method: 'GET', path: '/v1/comms/agents/{id}/messages', auth: 'user', desc: 'Paginated timeline (asc). Query: limit, before (ISO timestamp)' },
                      { method: 'POST', path: '/v1/comms/agents/{id}/messages', auth: 'user', desc: 'Send human message. Body: { content, metadata? }' },
                      { method: 'POST', path: '/v1/comms/replies', auth: 'agent', desc: 'Agent reply. Body: { content, replyToMessageId?, metadata? }' },
                    ].map((row) => (
                      <div key={row.path} className="flex flex-wrap items-start gap-2 text-[#F4F6FF]">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${row.method === 'GET' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {row.method}
                        </span>
                        <span className="text-brand">{row.path}</span>
                        <span className="text-[#555870]">({row.auth})</span>
                        <span className="text-[#A7ACBF] text-[11px] w-full mt-0.5 pl-0">{row.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* human_message command */}
                <div className="data-card p-6">
                  <h3 className="font-semibold mb-3">human_message command kind</h3>
                  <p className="text-sm text-[#A7ACBF] mb-3">
                    When a user sends a message, the backend creates a command with{' '}
                    <code className="text-brand bg-white/5 px-1.5 rounded">kind: "human_message"</code>.
                    Agents filter for these alongside approval_decision commands.
                  </p>
                  <pre className="text-xs font-mono text-[#F4F6FF] bg-white/5 rounded-lg p-4 overflow-x-auto whitespace-pre">{`// GET /v1/commands response item
{
  "id": "cmd-uuid",
  "kind": "human_message",
  "status": "pending",
  "sourceMessageId": "msg-uuid",
  "payload": {
    "messageId": "msg-uuid",
    "content": "Hey, what's the status of the report?"
  }
}`}</pre>
                </div>

                <div className="space-y-2">
                  {[
                    'Messages queue regardless of agent status — offline or paused agents accumulate messages safely',
                    'One persistent thread per agent in V1 (no multi-conversation support)',
                    'Raw agent text is rendered as-is in the Comms Hub',
                    'Approval decisions still flow through the Inbox; Comms Hub links there via a banner',
                    'Reply metadata fields (cost, model) appear as footer chips in the UI',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      <span className="text-[#A7ACBF]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Disconnecting */}
            <section id="disconnecting">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-brand" />
                </div>
                <h2 className="text-2xl font-bold">Disconnecting an Agent</h2>
              </div>
              <p className="text-[#A7ACBF] mb-6">
                To fully remove an agent as if it never connected, you need to do two things: remove
                the MCP server from your agent tool, and revoke the token in the dashboard. Either
                step alone leaves a dangling piece.
              </p>

              <div className="space-y-4">
                <div className="data-card p-6">
                  <h3 className="font-semibold mb-3">Step 1 — Remove the Jarvis integration from your agent</h3>
                  <p className="text-sm text-[#A7ACBF] mb-4">
                    How you do this depends on how you connected:
                  </p>
                  <div className="space-y-3 text-sm text-[#A7ACBF]">
                    {[
                      { label: 'MCP (Claude Code / Codex CLI)', detail: 'Run claude mcp remove jarvis' },
                      { label: 'MCP (Cursor / Windsurf)', detail: 'Delete the jarvis entry from mcpServers in your settings.json' },
                      { label: 'Python SDK', detail: 'Remove the JarvisAgent initialisation and any agent.log() / agent.request_approval() calls from your code' },
                      { label: 'HTTP API / Webhook', detail: 'Remove the X-Agent-Token header and stop sending requests to Jarvis endpoints' },
                      { label: 'OpenAI Agents SDK hooks', detail: 'Remove JarvisHooks from your Agent constructor' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                        <span><strong className="text-white">{item.label}:</strong> {item.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="data-card p-6">
                  <h3 className="font-semibold mb-3">Step 2 — Revoke the token in the dashboard</h3>
                  <p className="text-sm text-[#A7ACBF] mb-3">
                    Go to <strong className="text-white">Agents → [Agent Name] → Revoke Token</strong>.
                    Once revoked, any request using that token is rejected immediately — even if someone
                    still has the token value.
                  </p>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <span className="text-[#A7ACBF]">
                      You can also delete the agent entirely from the Agent Detail page to remove it
                      from your workspace.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Need help */}
            <section className="data-card p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Still stuck?</h2>
              <p className="text-[#A7ACBF] mb-6">
                We're happy to help you get connected. Email us or open the dashboard and use the
                agent registration flow — it walks you through the setup step by step.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact" className="btn-primary">
                  Contact support
                </Link>
                <Link to="/auth" className="btn-secondary">
                  Open dashboard
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </PublicLayout>
  );
}
