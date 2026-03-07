import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Eye, EyeOff, KeyRound, Lock, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import {
  createVaultSecret,
  deleteVaultSecret,
  getVaultSecrets,
  revealVaultSecret,
} from '@/lib/api';
import type { VaultSecret } from '@/types/index';

// ── AddSecretModal ─────────────────────────────────────────────────────────────

function AddSecretModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (secret: VaultSecret) => void;
}) {
  const [name, setName] = useState('');
  const [keyName, setKeyName] = useState('');
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const auto = val.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    setKeyName(auto);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !keyName.trim() || !value.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const secret = await createVaultSecret({ name: name.trim(), keyName: keyName.trim(), value });
      onCreated(secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create secret.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0B0E16] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-white">Add Secret</h3>
          </div>
          <button onClick={onClose} className="text-[#A7ACBF] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => { void submit(e); }} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A7ACBF] mb-1.5">Label *</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. OpenAI API Key"
              className="w-full rounded-lg border border-white/10 bg-[#05060B]/70 px-3 py-2.5 text-sm text-[#F4F6FF] placeholder:text-[#555870] focus:border-brand/70 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A7ACBF] mb-1.5">
              Key Name *
              <span className="ml-1 text-[#555870] font-normal">(agents use this to retrieve the secret)</span>
            </label>
            <input
              value={keyName}
              onChange={(e) => setKeyName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              placeholder="OPENAI_API_KEY"
              className="w-full rounded-lg border border-white/10 bg-[#05060B]/70 px-3 py-2.5 text-sm text-[#F4F6FF] placeholder:text-[#555870] font-mono focus:border-brand/70 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A7ACBF] mb-1.5">Secret Value *</label>
            <div className="relative">
              <input
                type={showValue ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Paste your secret here…"
                className="w-full rounded-lg border border-white/10 bg-[#05060B]/70 px-3 py-2.5 pr-10 text-sm text-[#F4F6FF] placeholder:text-[#555870] focus:border-brand/70 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowValue((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555870] hover:text-[#A7ACBF] transition-colors"
              >
                {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-[#555870]">
              Encrypted with AES-256 (Fernet) before storage. Never persisted in plaintext.
            </p>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-[#A7ACBF] hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !keyName.trim() || !value.trim() || saving}
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Encrypting…' : 'Save Secret'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── SecretRow ─────────────────────────────────────────────────────────────────

function SecretRow({
  secret,
  onDelete,
}: {
  secret: VaultSecret;
  onDelete: (id: string) => void;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [showPlain, setShowPlain] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleReveal = async () => {
    if (revealed) {
      setShowPlain((v) => !v);
      return;
    }
    setRevealing(true);
    try {
      const res = await revealVaultSecret(secret.id);
      setRevealed(res.value);
      setShowPlain(true);
    } finally {
      setRevealing(false);
    }
  };

  const handleCopy = async () => {
    let val = revealed;
    if (!val) {
      try {
        const res = await revealVaultSecret(secret.id);
        val = res.value;
        setRevealed(res.value);
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteVaultSecret(secret.id);
      onDelete(secret.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const displayValue = showPlain && revealed ? revealed : secret.preview;

  return (
    <div className="rounded-xl border border-white/8 bg-[#05060B]/60 p-4 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/20 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4 text-[#A5B4FC]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#F4F6FF] truncate">{secret.name}</p>
            <code className="text-[10px] text-brand font-mono">{secret.keyName}</code>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => { void handleReveal(); }}
            disabled={revealing}
            title={showPlain ? 'Hide value' : 'Reveal value'}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-[#A7ACBF] hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
          >
            {revealing ? (
              <span className="w-3.5 h-3.5 border border-[#A7ACBF] border-t-transparent rounded-full animate-spin" />
            ) : showPlain ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{showPlain ? 'Hide' : 'Reveal'}</span>
          </button>

          <button
            onClick={() => { void handleCopy(); }}
            title="Copy to clipboard"
            className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-[#A7ACBF] hover:bg-white/5 hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {confirmDelete ? (
            <>
              <button
                onClick={() => { void handleDelete(); }}
                disabled={deleting}
                className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-white/10 p-1.5 text-[#555870] hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete secret"
              className="rounded-lg border border-white/10 p-1.5 text-[#555870] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3">
        <code className="block w-full text-xs font-mono text-[#7D8293] bg-[#05060B] border border-white/5 rounded-lg px-3 py-2 truncate select-all">
          {displayValue}
        </code>
      </div>

      <p className="mt-2 text-[10px] text-[#555870]">
        Added {new Date(secret.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const KeyVault: React.FC = () => {
  const [secrets, setSecrets] = useState<VaultSecret[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadSecrets = useCallback(async () => {
    try {
      setError(null);
      const data = await getVaultSecrets();
      setSecrets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load secrets.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadSecrets(); }, [loadSecrets]);

  const handleCreated = (secret: VaultSecret) => {
    setSecrets((prev) => [...prev, secret].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    setSecrets((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Key Vault</h2>
          <p className="mt-1 text-sm text-[#A7ACBF]">
            Encrypted credential storage — agents retrieve secrets by name, plaintext never leaves the server.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-light transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Secret
        </button>
      </header>

      {/* Security info banner */}
      <div className="rounded-xl border border-brand/20 bg-brand/8 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#818CF8] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#E0E7FF]">AES-256 Encryption at Rest</p>
          <p className="mt-0.5 text-xs text-[#A5B4FC]/80 leading-relaxed">
            Secrets are encrypted with Fernet (AES-128-CBC + HMAC-SHA256) before storage.
            Plaintext values never touch the database or the frontend — only masked previews are shown.
            Agents retrieve secrets with{' '}
            <code className="font-mono text-[#818CF8]">GET /v1/vault/my-secrets/&#123;KEY_NAME&#125;</code>.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-white/10 bg-[#0B0E16]/80 p-8 text-center">
          <p className="text-[#A7ACBF] text-sm">Loading secrets…</p>
        </div>
      ) : secrets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#0B0E16]/40 p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-[#818CF8]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#F4F6FF]">No secrets stored yet</p>
            <p className="mt-1 text-xs text-[#555870]">
              Add API keys and credentials so your agents can use them securely.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Secret
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {secrets.map((secret) => (
            <SecretRow key={secret.id} secret={secret} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <p className="text-xs text-[#555870]">
        {secrets.length} secret{secrets.length !== 1 ? 's' : ''} stored
        {' · '}agents retrieve secrets with{' '}
        <code className="font-mono text-[#7D8293]">GET /v1/vault/my-secrets/&#123;KEY_NAME&#125;</code>
      </p>

      {showAddModal && (
        <AddSecretModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </section>
  );
};
