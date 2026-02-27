import React, { useState } from 'react';
import { VAULT_KEYS } from '../data';
import type { VaultKey } from '../types';

export const KeyVault: React.FC = () => {
    const [keys] = useState<VaultKey[]>(VAULT_KEYS);
    const [visible, setVisible] = useState<Record<string, boolean>>({});

    const toggle = (id: string) => setVisible(v => ({ ...v, [id]: !v[id] }));

    return (
        <section id="key-vault" className="view-section active">
            <header className="section-header">
                <h1>Key Vault</h1>
                <p className="subtitle">Encrypted API Key Storage</p>
            </header>
            <div className="content form-container glass-panel">
                <div className="vault-info">
                    <h3>Secure Credential Storage</h3>
                    <p>Keys are encrypted with AES-256. Agents access them via proxy, preventing leakages.</p>
                </div>
                {keys.map(k => (
                    <div key={k.id} className="form-group">
                        <label>{k.label}</label>
                        <div className="input-group">
                            <input
                                type={visible[k.id] ? 'text' : 'password'}
                                value={k.value}
                                readOnly
                            />
                            <button className="btn-outline" onClick={() => toggle(k.id)}>
                                {visible[k.id] ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                ))}
                <button className="btn-primary" style={{ marginTop: '24px' }}>+ Add New Key</button>
            </div>
        </section>
    );
};
