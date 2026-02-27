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
        <section id="comms" className="view-section active">
            <header className="section-header">
                <h1>Comms Hub</h1>
                <p className="subtitle">Agent Communication Log</p>
            </header>
            <div className="content chat-container glass-panel">
                <div className="chat-messages">
                    {messages.map(m => (
                        <div key={m.id} className={`msg ${m.sender}`}>
                            <strong>{m.name}</strong>
                            <p>{m.text}</p>
                            <span className="time">{m.time}</span>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        placeholder="Message your agents or inject context..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send()}
                    />
                    <button className="btn-primary" onClick={send}>Send</button>
                </div>
            </div>
        </section>
    );
};
