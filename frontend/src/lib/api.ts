import type { Agent, AgentEvent, InboxItem, SpendData } from '@/types/index';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

export type AgentCreateResponse = {
  agent: Agent;
  agentToken: string;
};

export type InboxDecision = 'approved' | 'rejected';

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.access_token) {
    throw new Error('Not authenticated');
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

  const makeRequest = (token: string) =>
    fetch(url.toString(), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
    });

  let response = await makeRequest(session.access_token);

  if (response.status === 401) {
    const { data: refreshData } = await supabase.auth.refreshSession();
    if (refreshData.session) {
      response = await makeRequest(refreshData.session.access_token);
      if (response.status === 401) {
        throw new Error(`Request failed (401)`);
      }
    } else {
      throw new Error(`Request failed (401)`);
    }
  }

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
