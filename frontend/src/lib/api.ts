import type { Agent, AgentEvent, InboxItem, SpendData } from '@/types/index';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';
export const USER_TOKEN_STORAGE_KEY = 'jarvis_user_token';

export type AuthResponse = {
  userId: string;
  email: string;
  userToken: string;
  issuedAt: string;
};

export type AgentCreateResponse = {
  agent: Agent;
  agentToken: string;
};

export type InboxDecision = 'approved' | 'rejected';

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const userToken = window.localStorage.getItem(USER_TOKEN_STORAGE_KEY)?.trim();
  if (!userToken) {
    throw new Error(`Missing user token. Set localStorage['${USER_TOKEN_STORAGE_KEY}'] to a valid bearer token.`);
  }

  const { query, ...init } = options;
  const url = new URL(`${API_BASE_URL}${path}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        message = body.detail;
      }
    } catch {
      // Fall through to default message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getAgents() {
  return apiRequest<Agent[]>('/v1/agents');
}

export function createAgent(payload: { name: string; description?: string }) {
  return apiRequest<AgentCreateResponse>('/v1/agents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getAgent(agentId: string) {
  return apiRequest<Agent>(`/v1/agents/${agentId}`);
}

export function updateAgentStatus(agentId: string, status: Agent['status']) {
  return apiRequest<Agent>(`/v1/agents/${agentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function revokeAgentToken(agentId: string) {
  return apiRequest<void>(`/v1/agents/${agentId}/revoke-token`, {
    method: 'POST',
  });
}

export function getAgentEvents(agentId: string, limit = 100) {
  return apiRequest<AgentEvent[]>(`/v1/agents/${agentId}/events`, {
    query: { limit },
  });
}

export function getEvents(limit = 50) {
  return apiRequest<AgentEvent[]>('/v1/events', {
    query: { limit },
  });
}

export function getInbox(status?: InboxItem['status']) {
  return apiRequest<InboxItem[]>('/v1/inbox', {
    query: { status },
  });
}

export function decideInboxItem(itemId: string, payload: { decision: InboxDecision; comment?: string }) {
  return apiRequest<InboxItem>(`/v1/inbox/${itemId}/decision`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getSpend() {
  return apiRequest<SpendData>('/v1/spend');
}

export function updateBudget(budget: number) {
  return apiRequest<SpendData>('/v1/spend/budget', {
    method: 'PATCH',
    body: JSON.stringify({ budget }),
  });
}

async function authRequest(path: string, body: object): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { detail?: string };
      if (data.detail) message = data.detail;
    } catch {
      // fall through
    }
    throw new Error(message);
  }

  const data = (await response.json()) as AuthResponse;
  window.localStorage.setItem(USER_TOKEN_STORAGE_KEY, data.userToken);
  return data;
}

export function signup(email: string, password: string): Promise<AuthResponse> {
  return authRequest('/v1/auth/signup', { email, password });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return authRequest('/v1/auth/login', { email, password });
}

export function logout(): void {
  window.localStorage.removeItem(USER_TOKEN_STORAGE_KEY);
}
