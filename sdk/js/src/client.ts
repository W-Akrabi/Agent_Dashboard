/**
 * Jarvis Mission Control JavaScript/TypeScript SDK.
 *
 * Connect any agent — OpenAI, Vercel AI SDK, LangChain.js, custom — to your
 * Jarvis dashboard in a few lines.
 *
 * Basic usage:
 *   import { JarvisAgent } from 'jarvis-mc';
 *
 *   const agent = new JarvisAgent({ token: 'your-token' });
 *   await agent.log('Fetching competitor data', { cost: 0.04 });
 *
 * With approval gates:
 *   await agent.checkpoint('Draft ready for review', 'Publish to Notion workspace');
 *   const decision = await agent.waitForDecision(); // resolves when you approve/reject
 *   if (decision.decision === 'approved') await publish();
 *
 * With streaming replies:
 *   await agent.typing();
 *   let full = '';
 *   for await (const chunk of stream) {
 *     full += chunk;
 *     await agent.streamChunk(chunk);
 *   }
 *   await agent.reply(full);
 */

const DEFAULT_BASE_URL = 'http://localhost:8000';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JarvisAgentOptions {
  /** Agent token from the Jarvis dashboard. */
  token: string;
  /** Jarvis API base URL. Defaults to http://localhost:8000. */
  baseUrl?: string;
}

export interface LogOptions {
  /** USD cost for this step. Defaults to 0. */
  cost?: number;
  /** Event type. Defaults to 'action'. */
  type?: 'action' | 'completion' | 'error' | 'tool_call' | 'approval_request';
  /** Previously completed steps shown for context. */
  completedActions?: string[];
}

export interface CheckpointOptions {
  /** USD cost incurred up to this point. Defaults to 0. */
  cost?: number;
  /** Already-completed steps shown for context. */
  completedActions?: string[];
}

export interface DecisionPayload {
  decision: 'approved' | 'rejected';
  comment?: string;
}

export interface HumanMessagePayload {
  messageId: string;
  content: string;
}

export interface Command {
  id: string;
  agentId: string;
  kind: string;
  payload: Record<string, unknown>;
  status: string;
  createdAt: string;
}

export interface CommsMessage {
  id: string;
  agentId: string;
  sender: string;
  content: string;
  messageStatus: string;
  replyToMessageId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface WorkshopTask {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'done';
  agentId: string;
}

export interface ReplyOptions {
  /** UUID of the comms_messages row being replied to. */
  replyToMessageId?: string;
  /** Optional metadata e.g. { cost: 0.012, model: 'gpt-4o' }. */
  metadata?: Record<string, unknown>;
}

// ── JarvisAgent ───────────────────────────────────────────────────────────────

export class JarvisAgent {
  private readonly _baseUrl: string;
  private readonly _token: string;

  constructor(options: JarvisAgentOptions) {
    this._baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this._token = options.token;
  }

  // ── HTTP helpers ─────────────────────────────────────────────────────────────

  private async _post<T = Record<string, unknown>>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(`${this._baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'X-Agent-Token': this._token,
        'Content-Type': 'application/json',
        'User-Agent': 'jarvis-mc-js/0.1.0',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(`Jarvis API error ${response.status}: ${text}`);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private async _get<T = unknown[]>(
    path: string,
    params?: Record<string, string | number>,
    timeoutSeconds?: number,
  ): Promise<T> {
    const url = new URL(`${this._baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }
    const signal =
      timeoutSeconds != null
        ? AbortSignal.timeout((timeoutSeconds + 10) * 1000)
        : undefined;
    const response = await fetch(url.toString(), {
      headers: {
        'X-Agent-Token': this._token,
        'User-Agent': 'jarvis-mc-js/0.1.0',
      },
      signal,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(`Jarvis API error ${response.status}: ${text}`);
    }
    return response.json() as Promise<T>;
  }

  // ── Events ────────────────────────────────────────────────────────────────────

  /**
   * Log an event to the dashboard. Returns the event ID.
   *
   * @param message - What the agent did.
   * @param options - Optional cost, type, and completedActions.
   */
  async log(message: string, options: LogOptions = {}): Promise<string> {
    const data = await this._post<{ event: { id: string } }>('/v1/events', {
      type: options.type ?? 'action',
      message,
      cost: options.cost ?? 0,
      requiresApproval: false,
      completedActions: options.completedActions ?? [],
    });
    return data.event.id;
  }

  /**
   * Request human approval before proceeding. Returns the task ID.
   *
   * The dashboard inbox will show this request. Call waitForDecision()
   * to resolve when the human approves or rejects.
   *
   * @param message - Description of what is about to happen.
   * @param proposedAction - The specific action requiring approval.
   * @param options - Optional cost and completedActions.
   */
  async checkpoint(
    message: string,
    proposedAction: string,
    options: CheckpointOptions = {},
  ): Promise<string> {
    const data = await this._post<{ taskId?: string }>('/v1/events', {
      type: 'approval_request',
      message,
      cost: options.cost ?? 0,
      requiresApproval: true,
      proposedAction,
      completedActions: options.completedActions ?? [],
    });
    if (!data.taskId) {
      throw new Error('Server did not return a taskId for the checkpoint.');
    }
    return data.taskId;
  }

  // ── Commands ──────────────────────────────────────────────────────────────────

  /**
   * Acknowledge a command by ID, marking it as processed.
   */
  async ack(commandId: string): Promise<void> {
    await this._post(`/v1/commands/${commandId}/ack`, {});
  }

  /**
   * Resolve when a human approves or rejects in the dashboard.
   *
   * Uses long polling — no wasted requests while waiting.
   * Automatically acknowledges the command before resolving.
   *
   * @returns The decision payload: { decision: 'approved' | 'rejected', comment?: string }
   */
  async waitForDecision(): Promise<DecisionPayload> {
    const pollTimeout = 30;
    while (true) {
      const commands = await this._get<Command[]>(
        '/v1/commands/listen',
        { timeout: pollTimeout },
        pollTimeout,
      );
      for (const cmd of commands) {
        if (cmd.kind === 'approval_decision' && cmd.status === 'pending') {
          await this.ack(cmd.id);
          return cmd.payload as unknown as DecisionPayload;
        }
      }
    }
  }

  // ── Comms Hub ─────────────────────────────────────────────────────────────────

  /**
   * Return all pending human_message commands for this agent (one-time fetch).
   */
  async getHumanMessages(): Promise<Command[]> {
    const commands = await this._get<Command[]>('/v1/commands');
    return commands.filter(
      (c) => c.kind === 'human_message' && c.status === 'pending',
    );
  }

  /**
   * Resolve when a human sends a message from the Comms Hub.
   *
   * Uses long polling — no wasted requests while waiting.
   * Automatically acknowledges the command before resolving.
   *
   * @returns The message payload: { messageId: string, content: string }
   */
  async waitForHumanMessage(): Promise<HumanMessagePayload> {
    const pollTimeout = 30;
    while (true) {
      const commands = await this._get<Command[]>(
        '/v1/commands/listen',
        { timeout: pollTimeout },
        pollTimeout,
      );
      for (const cmd of commands) {
        if (cmd.kind === 'human_message' && cmd.status === 'pending') {
          await this.ack(cmd.id);
          return cmd.payload as unknown as HumanMessagePayload;
        }
      }
    }
  }

  /**
   * Signal to the dashboard that the agent is (or is no longer) typing.
   *
   * @param isTyping - True to show indicator, false to hide it. Defaults to true.
   */
  async typing(isTyping = true): Promise<void> {
    await this._post('/v1/comms/typing', { isTyping });
  }

  /**
   * Stream a token chunk to the Comms Hub in real-time.
   *
   * Call in a loop as tokens arrive from the model. Finish by calling reply()
   * with the full response, which stores it in the DB and clears the stream.
   *
   * @example
   * await agent.typing();
   * let full = '';
   * for await (const chunk of stream) {
   *   full += chunk;
   *   await agent.streamChunk(chunk);
   * }
   * await agent.reply(full);
   */
  async streamChunk(content: string): Promise<void> {
    await this._post('/v1/comms/stream', { content });
  }

  /**
   * Post a reply to the Comms Hub as the agent.
   *
   * @param content - The reply text.
   * @param options - Optional replyToMessageId and metadata.
   */
  async reply(content: string, options: ReplyOptions = {}): Promise<CommsMessage> {
    const body: Record<string, unknown> = {
      content,
      metadata: options.metadata ?? {},
    };
    if (options.replyToMessageId) {
      body.replyToMessageId = options.replyToMessageId;
    }
    return this._post<CommsMessage>('/v1/comms/replies', body);
  }

  /**
   * Reply to a human_message command and acknowledge it in one call.
   *
   * This is the canonical flow for responding to a Comms Hub message:
   * 1. POST /v1/comms/replies (marks parent message as responded)
   * 2. POST /v1/commands/{id}/ack (marks command as acked)
   *
   * @param command - A command returned by getHumanMessages().
   * @param content - The reply text.
   * @param metadata - Optional metadata e.g. { cost, model }.
   */
  async respondToHumanCommand(
    command: Command,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<CommsMessage> {
    const messageId = (command.payload as { messageId?: string }).messageId;
    const reply = await this.reply(content, { replyToMessageId: messageId, metadata });
    try {
      await this.ack(command.id);
    } catch {
      // ack failure never breaks agent code
    }
    return reply;
  }

  // ── Workshop ──────────────────────────────────────────────────────────────────

  /**
   * Return tasks assigned to this agent that are in 'backlog' or 'in_progress'.
   */
  async getMyTasks(): Promise<WorkshopTask[]> {
    return this._get<WorkshopTask[]>('/v1/workshop/my-tasks');
  }

  /**
   * Update the status of a task assigned to this agent.
   */
  async updateTaskStatus(
    taskId: string,
    status: 'backlog' | 'in_progress' | 'done',
  ): Promise<WorkshopTask> {
    return this._post<WorkshopTask>(`/v1/workshop/my-tasks/${taskId}/status`, { status });
  }

  /** Move a task to 'in_progress'. */
  async startTask(taskId: string): Promise<WorkshopTask> {
    return this.updateTaskStatus(taskId, 'in_progress');
  }

  /** Mark a task as 'done'. */
  async completeTask(taskId: string): Promise<WorkshopTask> {
    return this.updateTaskStatus(taskId, 'done');
  }
}

// ── OpenAIJarvis ──────────────────────────────────────────────────────────────

/** Minimal duck-type for the OpenAI chat.completions interface. */
interface OpenAICompletionsLike {
  create(params: Record<string, unknown>): Promise<{
    choices?: Array<{ message?: { content?: string | null } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  }>;
}

interface OpenAIClientLike {
  chat: { completions: OpenAICompletionsLike };
}

/**
 * Drop-in wrapper around an OpenAI client that auto-reports every
 * chat completion (cost + response summary) to your Jarvis dashboard.
 *
 * Pass your already-constructed OpenAI client — no extra dependencies needed.
 *
 * @example
 * import OpenAI from 'openai';
 * import { OpenAIJarvis } from 'jarvis-mc';
 *
 * const openai = new OpenAI();
 * const client = new OpenAIJarvis({
 *   openai,
 *   jarvisToken: 'your-token',
 * });
 *
 * // Identical to openai.chat.completions.create(...)
 * const response = await client.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Summarize this...' }],
 * });
 */
export class OpenAIJarvis {
  readonly chat: { completions: _OpenAICompletionsProxy };

  constructor(options: {
    openai: OpenAIClientLike;
    jarvisToken: string;
    jarvisUrl?: string;
  }) {
    const jarvis = new JarvisAgent({
      token: options.jarvisToken,
      baseUrl: options.jarvisUrl,
    });
    this.chat = {
      completions: new _OpenAICompletionsProxy(options.openai.chat.completions, jarvis),
    };
  }
}

// Per-model pricing (USD per token). Add models as needed.
const _MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o':            { input: 2.50 / 1_000_000,  output: 10.00 / 1_000_000 },
  'gpt-4o-mini':       { input: 0.15 / 1_000_000,  output: 0.60  / 1_000_000 },
  'gpt-4-turbo':       { input: 10.00 / 1_000_000, output: 30.00 / 1_000_000 },
  'gpt-3.5-turbo':     { input: 0.50  / 1_000_000, output: 1.50  / 1_000_000 },
  'o1':                { input: 15.00 / 1_000_000, output: 60.00 / 1_000_000 },
  'o1-mini':           { input: 3.00  / 1_000_000, output: 12.00 / 1_000_000 },
};

class _OpenAICompletionsProxy {
  constructor(
    private readonly _completions: OpenAICompletionsLike,
    private readonly _jarvis: JarvisAgent,
  ) {}

  async create(params: Record<string, unknown>): Promise<ReturnType<OpenAICompletionsLike['create']>> {
    const response = await this._completions.create(params);

    try {
      const model = response.model ?? (params.model as string | undefined) ?? 'gpt';
      const pricing = _MODEL_PRICING[model] ?? _MODEL_PRICING['gpt-4o'];
      const usage = response.usage ?? {};
      const cost =
        (usage.prompt_tokens ?? 0) * pricing.input +
        (usage.completion_tokens ?? 0) * pricing.output;

      const firstContent = response.choices?.[0]?.message?.content ?? '';
      const message = `[${model}] ${firstContent.slice(0, 200)}` || `[${model}] API call`;

      await this._jarvis.log(message, { cost, type: 'action' });
    } catch {
      // Jarvis errors never break agent code
    }

    return response;
  }
}
