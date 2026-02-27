import React, { useState, useRef, useEffect } from 'react';
import { CHAT_MESSAGES } from '../data';
import type { ChatMessage } from '../types';

export const CommsHub: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      id: `m${Date.now()}`,
      sender: 'human',
      name: 'You',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(m => [...m, msg]);
    setInput('');
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Comms Hub</h2>
        <p className="mt-1 text-sm text-[#A7ACBF]">Live communication channel between you and active agents.</p>
      </header>

      <div className="rounded-xl border border-white/10 bg-[#0B0E16]/80 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <div className="h-[420px] space-y-3 overflow-y-auto pr-2">
          {messages.map(m => {
            const isHuman = m.sender === 'human';
            return (
              <article
                key={m.id}
                className={`max-w-[85%] rounded-lg border p-3 ${
                  isHuman
                    ? 'ml-auto border-[#4F46E5]/40 bg-[#4F46E5]/15 text-[#E0DDFF]'
                    : 'border-white/10 bg-[#05060B]/80 text-[#F4F6FF]'
                }`}
              >
                <p className="text-xs font-semibold">{m.name}</p>
                <p className="mt-1 text-sm leading-relaxed">{m.text}</p>
                <p className="mt-2 text-[11px] text-[#A7ACBF]">{m.time}</p>
              </article>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Message your agents or inject context..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            className="h-11 flex-1 rounded-lg border border-white/10 bg-[#05060B]/70 px-3 text-sm text-[#F4F6FF] placeholder:text-[#7D8293] focus:border-[#4F46E5]/70 focus:outline-none"
          />
          <button
            className="h-11 rounded-lg bg-[#4F46E5] px-5 text-sm font-medium text-white transition-colors hover:bg-[#5B52EC] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={send}
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
};
