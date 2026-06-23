'use client';

import { useQuery } from 'react-query';
import { tiffinApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  active:    'text-leaf bg-leaf/10',
  paused:    'text-gold-700 bg-gold-50',
  cancelled: 'text-red-500 bg-red-50',
  pending:   'text-blue-600 bg-blue-50',
};

export default function AdminTiffinPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery(
    ['admin-tiffin', statusFilter],
    () => tiffinApi.getAll(statusFilter !== 'all' ? { status: statusFilter } : {}).then((r) => r.data)
  );

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'cancel') => {
    setUpdating(id + action);
    try {
      if (action === 'pause')  await tiffinApi.pause(id);
      if (action === 'resume') await tiffinApi.resume(id);
      if (action === 'cancel') await tiffinApi.cancel(id);
      toast.success(`Subscription ${action}d`);
      refetch();
    } catch { toast.error('Action failed'); } finally { setUpdating(null); }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-espresso mb-6">Tiffin Subscriptions</h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {['all', 'active', 'paused', 'cancelled', 'pending'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-saffron-900 text-white' : 'bg-ivory border border-warm-200 text-espresso hover:bg-warm-200'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 skeleton-shimmer rounded-xl" />)}</div>
      ) : (data?.subscriptions?.length === 0) ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🍱</p>
          <p className="font-display font-bold text-xl">No subscriptions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.subscriptions ?? []).map((sub: {
            _id: string;
            subscriptionNumber?: string;
            status: string;
            planType: string;
            mealType: string;
            price: number;
            startDate: string;
            endDate: string;
            user: { name: string; phone: string; email: string };
            deliveryAddress?: { area: string };
          }) => (
            <div key={sub._id} className="card p-4 flex flex-wrap items-center gap-4">
              <div className="text-3xl">{sub.mealType === 'lunch' ? '☀️' : sub.mealType === 'dinner' ? '🌙' : '🌟'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-bold text-espresso text-sm capitalize">{sub.planType} {sub.mealType}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[sub.status] || ''}`}>
                    {sub.status}
                  </span>
                </div>
                <p className="text-xs text-espresso/60">{sub.user?.name} · {sub.user?.phone}</p>
                <p className="text-xs text-espresso/40">
                  {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                  {sub.deliveryAddress?.area ? ` · ${sub.deliveryAddress.area}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-saffron-900">{formatCurrency(sub.price)}</p>
              </div>
              <div className="flex gap-2">
                {sub.status === 'active' && (
                  <button onClick={() => handleAction(sub._id, 'pause')} disabled={!!updating}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold-50 text-gold-700 hover:bg-gold-100 transition-all">
                    Pause
                  </button>
                )}
                {sub.status === 'paused' && (
                  <button onClick={() => handleAction(sub._id, 'resume')} disabled={!!updating}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-leaf/10 text-leaf hover:bg-leaf/20 transition-all">
                    Resume
                  </button>
                )}
                {sub.status !== 'cancelled' && (
                  <button onClick={() => handleAction(sub._id, 'cancel')} disabled={!!updating}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-all">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
