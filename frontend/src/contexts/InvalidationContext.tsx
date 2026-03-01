import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type InvalidationDomain = 'events' | 'tasks' | 'agents';

type InvalidationContextType = {
  subscribe: (domain: InvalidationDomain, callback: () => void) => () => void;
  isConnected: boolean;
};

const InvalidationContext = createContext<InvalidationContextType | undefined>(undefined);

export function InvalidationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  const subscribersRef = useRef<Map<InvalidationDomain, Set<() => void>>>(
    new Map([
      ['events', new Set()],
      ['tasks', new Set()],
      ['agents', new Set()],
    ])
  );

  const debounceTimersRef = useRef<Map<InvalidationDomain, ReturnType<typeof setTimeout>>>(new Map());

  const wasConnectedRef = useRef<boolean>(false);

  const emit = (domain: InvalidationDomain) => {
    const existing = debounceTimersRef.current.get(domain);
    if (existing !== undefined) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      subscribersRef.current.get(domain)?.forEach((cb) => cb());
    }, 500);
    debounceTimersRef.current.set(domain, timer);
  };

  const emitAll = () => {
    emit('events');
    emit('tasks');
    emit('agents');
  };

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      void supabase.removeAllChannels();
      setIsConnected(false);
      return;
    }

    const channel = supabase
      .channel('invalidation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => emit('events'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => emit('tasks'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => emit('agents'))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (!wasConnectedRef.current) {
            emitAll();
          }
          wasConnectedRef.current = true;
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
          wasConnectedRef.current = false;
          setIsConnected(false);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
      debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
      debounceTimersRef.current.clear();
    };
  }, [userId]);

  const subscribe = useCallback((domain: InvalidationDomain, callback: () => void) => {
    const set = subscribersRef.current.get(domain) ?? new Set();
    if (!subscribersRef.current.has(domain)) {
      subscribersRef.current.set(domain, set);
    }
    set.add(callback);
    return () => {
      set.delete(callback);
    };
  }, []);

  return (
    <InvalidationContext.Provider value={{ subscribe, isConnected }}>
      {children}
    </InvalidationContext.Provider>
  );
}

export function useInvalidation() {
  const ctx = useContext(InvalidationContext);
  if (ctx === undefined) {
    throw new Error('useInvalidation must be used within an InvalidationProvider');
  }
  return ctx;
}
