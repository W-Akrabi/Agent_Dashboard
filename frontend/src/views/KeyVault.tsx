import React, { useState } from 'react';
import { VAULT_KEYS } from '../data';
import type { VaultKey } from '../types';

export const KeyVault: React.FC = () => {
  const [keys] = useState<VaultKey[]>(VAULT_KEYS);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setVisible(v => ({ ...v, [id]: !v[id] }));

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Key Vault</h2>
        <p className="mt-1 text-sm text-[#A7ACBF]">Encrypted API key storage with controlled visibility.</p>
      </header>

      <div className="rounded-xl border border-white/10 bg-[#0B0E16]/80 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <div className="mb-5 rounded-lg border border-[#4F46E5]/25 bg-[#4F46E5]/10 p-3">
          <h3 className="text-sm font-semibold text-[#E0DDFF]">Secure Credential Storage</h3>
          <p className="mt-1 text-xs text-[#C7CCDD]">
            Keys are encrypted with AES-256. Agents access them via proxy, preventing direct credential leakage.
          </p>
        </div>

        <div className="space-y-4">
          {keys.map(k => (
            <div key={k.id} className="space-y-2">
              <label className="text-xs font-medium text-[#A7ACBF]">{k.label}</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type={visible[k.id] ? 'text' : 'password'}
                  value={k.value}
                  readOnly
                  className="h-10 flex-1 rounded-lg border border-white/10 bg-[#05060B]/70 px-3 text-sm text-[#F4F6FF] focus:border-[#4F46E5]/70 focus:outline-none"
                />
                <button
                  className="h-10 rounded-lg border border-white/20 px-4 text-sm font-medium text-[#F4F6FF] transition-colors hover:bg-white/5"
                  onClick={() => toggle(k.id)}
                >
                  {visible[k.id] ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-5 h-10 rounded-lg bg-[#4F46E5] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5B52EC]">
          + Add New Key
        </button>
      </div>
    </section>
  );
};
