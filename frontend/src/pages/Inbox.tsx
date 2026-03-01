import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, XCircle, MessageSquare, Bot, Clock } from 'lucide-react';
import { decideInboxItem, getInbox } from '@/lib/api';
import type { InboxItem } from '@/types/index';
import { useInvalidation } from '@/contexts/InvalidationContext';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function Inbox() {
  const { subscribe } = useInvalidation();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [comment, setComment] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInbox = async () => {
    try {
      setError(null);
      const response = await getInbox();
      setItems(response);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load inbox.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    return subscribe('tasks', loadInbox);
  }, [subscribe]);

  const filteredItems = useMemo(
    () => items.filter((item) => (filter === 'all' ? true : item.status === filter)),
    [items, filter]
  );

  const handleDecision = async (itemId: string, decision: 'approved' | 'rejected') => {
    try {
      const updated = await decideInboxItem(itemId, { decision, comment: comment || undefined });
      setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
      setComment('');
      setSelectedItem(null);
    } catch (decisionError) {
      console.error(decisionError);
      setError(decisionError instanceof Error ? decisionError.message : 'Failed to submit decision.');
    }
  };

  const getStatusColor = (status: InboxItem['status']) => {
    switch (status) {
      case 'pending':
        return 'text-orange-400 bg-orange-400/10';
      case 'approved':
        return 'text-green-400 bg-green-400/10';
      case 'rejected':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-[#A7ACBF] bg-white/10';
    }
  };

  if (isLoading) {
    return (
      <div className="data-card p-8 text-center">
        <p className="text-[#A7ACBF]">Loading inbox...</p>
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Approval Inbox</h2>
          <p className="text-[#A7ACBF]">{items.filter((item) => item.status === 'pending').length} pending approvals</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
          {(['all', 'pending', 'approved', 'rejected'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                filter === f ? 'bg-[#4F46E5] text-white' : 'text-[#A7ACBF] hover:text-white hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="data-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#4F46E5]/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#4F46E5]" />
            </div>
            <h3 className="text-lg font-medium mb-2">All caught up!</h3>
            <p className="text-[#A7ACBF]">No {filter !== 'all' ? filter : ''} approvals to review.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isPending = item.status === 'pending';
            const isSelected = selectedItem === item.id;

            return (
              <div key={item.id} className="data-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4F46E5]/20 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-[#4F46E5]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.agentName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>{item.status}</span>
                        <span className="text-xs text-[#A7ACBF] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-[#A7ACBF] mb-2 uppercase tracking-wider">Completed</p>
                  <ul className="space-y-2">
                    {item.completedActions.map((action, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-[#A7ACBF]">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-[#4F46E5]/10 border border-[#4F46E5]/30 mb-4">
                  <p className="text-xs text-[#4F46E5] mb-2 uppercase tracking-wider">Proposed Next Action</p>
                  <p className="font-medium">{item.proposedAction}</p>
                </div>

                {item.comment && (
                  <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-white/5">
                    <MessageSquare className="w-4 h-4 text-[#A7ACBF] mt-0.5" />
                    <p className="text-sm text-[#A7ACBF]">{item.comment}</p>
                  </div>
                )}

                {isPending && (
                  <div className="space-y-3">
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment (optional)..."
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#4F46E5]"
                        />
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => (isSelected ? void handleDecision(item.id, 'approved') : setSelectedItem(item.id))}
                        className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isSelected ? 'Confirm Approve' : 'Approve'}
                      </button>
                      <button
                        onClick={() => (isSelected ? void handleDecision(item.id, 'rejected') : setSelectedItem(item.id))}
                        className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        {isSelected ? 'Confirm Reject' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

