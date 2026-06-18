'use client';

import { useQuery } from 'react-query';
import { tiffinApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { RefreshCw, Pause, X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  active:    'text-leaf bg-leaf/10 border-leaf/20',
  paused:    'text-gold-700 bg-gold-50 border-gold-200',
  cancelled: 'text-red-500 bg-red-50 border-red-200',
  pending:   'text-blue-600 bg-blue-50 border-blue-200',
};

export default function MyTiffinPage() {
  const { isAuthenticated } = useAuthStore();
  const [updating, setUpdating] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery(
    'my-tiffins',
    () => tiffinApi.mySubscriptions().then((r) => r.data.subscriptions),
    { enabled: isAuthenticated }
  );

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'cancel') => {
    if (action === 'cancel' && !confirm('Cancel this subscription? This cannot be undone.')) return;
    setUpdating(id + action);
    try {
      if (action === 'pause')  await tiffinApi.pause(id);
      if (action === 'resume') await tiffinApi.resume(id);
      if (action === 'cancel') await tiffinApi.cancel(id);
      toast.success(`Subscription ${action}d`);
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally { setUpdating(null); }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-3">🔒</p>
          <Link href="/auth/login?redirect=/profile/tiffin" className="btn-primary mt-4">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="container-custom py-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-espresso">My Tiffin</h1>
            <p className="text-espresso/60 text-sm mt-0.5">Manage your tiffin subscriptions</p>
          </div>
          <Link href="/tiffin" className="btn-primary text-sm py-2.5">+ Subscribe</Link>
        </div>

        {isLoading && <div className="space-y-4">{[1,2].map((i) => <div key={i} className="h-36 skeleton-shimmer rounded-2xl" />)}</div>}

        {!isLoading && (!data || data.length === 0) && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🍱</p>
            <p className="font-display font-bold text-xl text-espresso mb-2">No tiffin subscriptions yet</p>
            <p className="text-espresso/60 text-sm mb-6">Subscribe to get fresh homestyle food every day.</p>
            <Link href="/tiffin" className="btn-primary">View Tiffin Plans →</Link>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="space-y-4">
            {data.map((sub: {
              _id: string;
              status: string;
              planType: string;
              mealType: string;
              price: number;
              startDate: string;
              endDate: string;
              deliveryAddress?: { line1: string; area: string };
              paymentStatus: string;
            }) => (
              <div key={sub._id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{sub.mealType === 'lunch' ? '☀️' : sub.mealType === 'dinner' ? '🌙' : '🌟'}</span>
                    <div>
                      <p className="font-display font-semibold text-espresso capitalize">
                        {sub.planType} {sub.mealType}
                      </p>
                      <p className="text-xs text-espresso/50">
                        {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[sub.status]}`}>
                      {sub.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-espresso/70 mb-4">
                  <div className="flex justify-between"><span>Price</span><span className="font-bold text-saffron-900">{formatCurrency(sub.price)}</span></div>
                  <div className="flex justify-between"><span>Payment</span><span className={`font-semibold ${sub.paymentStatus === 'paid' ? 'text-leaf' : 'text-gold-700'}`}>{sub.paymentStatus.toUpperCase()}</span></div>
                  {sub.deliveryAddress && <div className="flex justify-between"><span>Delivery</span><span>{sub.deliveryAddress.line1}, {sub.deliveryAddress.area}</span></div>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {sub.status === 'active' && (
                    <button onClick={() => handleAction(sub._id, 'pause')} disabled={!!updating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gold-50 text-gold-700 hover:bg-gold-100 border border-gold-200 transition-all">
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}
                  {sub.status === 'paused' && (
                    <button onClick={() => handleAction(sub._id, 'resume')} disabled={!!updating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-leaf/10 text-leaf hover:bg-leaf/20 border border-leaf/20 transition-all">
                      <RefreshCw className="w-3.5 h-3.5" /> Resume
                    </button>
                  )}
                  {sub.status !== 'cancelled' && (
                    <button onClick={() => handleAction(sub._id, 'cancel')} disabled={!!updating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition-all">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
