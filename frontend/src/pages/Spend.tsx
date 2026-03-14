import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Edit2, Check, X } from 'lucide-react';
import { NotificationIcon } from '@/components/ui/animated-state-icons';
import type { SpendData } from '@/types/index';
import { getSpend, getSseToken, updateAlertWebhook, updateBudget } from '@/lib/api';
import { useInvalidation } from '@/contexts/InvalidationContext';

const _API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

const defaultSpendData: SpendData = {
  daily: 0,
  monthly: 0,
  budget: 1000,
  alertWebhookUrl: null,
  agentBreakdown: [],
};

export default function Spend() {
  const { subscribe } = useInvalidation();
  const [spendData, setSpendData] = useState<SpendData>(defaultSpendData);
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(defaultSpendData.budget.toString());
  const [editingWebhook, setEditingWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState<string>('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSpend = async () => {
    try {
      setError(null);
      const response = await getSpend();
      setSpendData(response);
      setNewBudget(response.budget.toString());
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load spend data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSpend();
  }, []);

  useEffect(() => {
    return subscribe('events', loadSpend);
  }, [subscribe]);

  // SSE — primary real-time channel; polling via InvalidationContext is the fallback
  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    const connect = async () => {
      if (!mounted) return;
      let sseToken: string;
      try { sseToken = await getSseToken(); } catch { return; }
      if (!mounted) return;
      es = new EventSource(`${_API_BASE}/v1/stream/spend?token=${sseToken}`);
      es.onmessage = () => { void loadSpend(); };
      es.onerror = () => {
        es?.close();
        es = null;
        if (mounted) retryTimer = setTimeout(() => { void connect(); }, 5000);
      };
    };

    void connect();
    return () => {
      mounted = false;
      es?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [loadSpend]);

  const budgetPercent = spendData.budget > 0 ? (spendData.monthly / spendData.budget) * 100 : 0;
  const remaining = spendData.budget - spendData.monthly;

  const handleSaveBudget = async () => {
    const budget = parseFloat(newBudget);
    if (!(budget > 0)) return;

    try {
      setError(null);
      const updated = await updateBudget(budget);
      setSpendData(updated);
      setEditingBudget(false);
      setNewBudget(updated.budget.toString());
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : 'Failed to update budget.');
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      const trimmed = newWebhookUrl.trim();
      const updated = await updateAlertWebhook(trimmed || null);
      setSpendData(updated);
      setEditingWebhook(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save webhook URL.');
    } finally {
      setSavingWebhook(false);
    }
  };

  const getAlertLevel = () => {
    if (budgetPercent >= 100) return 'critical';
    if (budgetPercent >= 80) return 'warning';
    if (budgetPercent >= 50) return 'info';
    return 'normal';
  };

  const alertConfig = {
    critical: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', icon: AlertTriangle },
    warning: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', icon: AlertTriangle },
    info: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', icon: TrendingUp },
    normal: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', icon: TrendingDown },
  };

  const alert = alertConfig[getAlertLevel()];

  if (isLoading) {
    return (
      <div className="data-card p-8 text-center">
        <p className="text-[#A7ACBF]">Loading spend data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {budgetPercent >= 80 && (
        <div className={`p-4 rounded-lg ${alert.bg} border ${alert.border} flex items-center gap-3`}>
          <NotificationIcon size={24} color={budgetPercent >= 100 ? '#F87171' : '#FB923C'} />
          <div>
            <p className={`font-medium ${alert.color}`}>{budgetPercent >= 100 ? 'Budget Exceeded' : 'Budget Warning'}</p>
            <p className="text-sm text-[#A7ACBF]">
              {budgetPercent >= 100
                ? `You've exceeded your monthly budget by $${(spendData.monthly - spendData.budget).toFixed(2)}`
                : `You've used ${budgetPercent.toFixed(0)}% of your monthly budget`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Today</span>
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">${spendData.daily.toFixed(2)}</p>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">This Month</span>
            <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand" />
            </div>
          </div>
          <p className="text-2xl font-bold">${spendData.monthly.toFixed(2)}</p>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Budget</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingBudget ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newBudget}
                  onChange={(event) => setNewBudget(event.target.value)}
                  className="w-24 px-2 py-1 bg-white/5 border border-white/10 rounded text-lg font-bold"
                  autoFocus
                />
                <button onClick={() => void handleSaveBudget()} className="p-1 text-green-400 hover:bg-green-400/10 rounded">
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingBudget(false);
                    setNewBudget(spendData.budget.toString());
                  }}
                  className="p-1 text-red-400 hover:bg-red-400/10 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold">${spendData.budget.toFixed(0)}</p>
                <button onClick={() => setEditingBudget(true)} className="p-1 text-[#A7ACBF] hover:text-white">
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="data-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A7ACBF] text-sm">Remaining</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-400' : ''}`}>${remaining.toFixed(2)}</p>
        </div>
      </div>

      <div className="data-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Monthly Budget</h3>
          <span className={`text-sm font-medium ${budgetPercent >= 80 ? 'text-orange-400' : 'text-brand'}`}>
            {budgetPercent.toFixed(0)}% used
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetPercent >= 80 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-brand to-brand-secondary'
            }`}
            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-[#A7ACBF]">
          <span>$0</span>
          <span>${(spendData.budget / 2).toFixed(0)}</span>
          <span>${spendData.budget.toFixed(0)}</span>
        </div>
      </div>

      <div className="data-card p-6">
        <h3 className="font-semibold mb-6">Spend by Agent</h3>
        <div className="space-y-4">
          {spendData.agentBreakdown
            .slice()
            .sort((a, b) => b.spend - a.spend)
            .map((item, index) => {
              const percent = spendData.monthly > 0 ? (item.spend / spendData.monthly) * 100 : 0;

              return (
                <div key={item.agentId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-6">#{index + 1}</span>
                      <span className="text-sm">{item.agentName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono">${item.spend.toFixed(2)}</span>
                      <span className="text-xs text-[#A7ACBF] w-12 text-right">{percent.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden ml-9">
                    <div
                      className="h-full bg-gradient-to-r from-brand to-brand-secondary rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          {spendData.agentBreakdown.length === 0 && <p className="text-sm text-[#A7ACBF]">No spend data yet.</p>}
        </div>
      </div>

      <div className="data-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Budget Alerts</h3>
          {!editingWebhook && (
            <button
              onClick={() => {
                setNewWebhookUrl(spendData.alertWebhookUrl ?? '');
                setEditingWebhook(true);
              }}
              className="p-1 text-[#A7ACBF] hover:text-white"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-[#A7ACBF] mb-4">
          Receive a POST request when monthly spend crosses 80% or 100% of your budget.
          Leave blank to disable.
        </p>
        {editingWebhook ? (
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="https://your-endpoint.com/budget-alert"
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-mono"
              autoFocus
            />
            <button
              onClick={() => void handleSaveWebhook()}
              disabled={savingWebhook}
              className="p-1.5 text-green-400 hover:bg-green-400/10 rounded disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingWebhook(false)}
              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
            {spendData.alertWebhookUrl ? (
              <code className="text-xs font-mono text-[#A7ACBF] truncate">{spendData.alertWebhookUrl}</code>
            ) : (
              <span className="text-xs text-[#A7ACBF] italic">No webhook configured — click edit to add one</span>
            )}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {[
            { percent: 80, color: 'bg-orange-400', label: '80% — Warning alert sent' },
            { percent: 100, color: 'bg-red-400', label: '100% — Critical alert sent' },
          ].map((t) => (
            <div key={t.percent} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.color}`} />
              <span className="text-sm text-[#A7ACBF]">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

