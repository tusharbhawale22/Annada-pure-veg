'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { orderApi } from '@/lib/api';
import { formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [status, setStatus]   = useState('all');
  const [search, setSearch]   = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const params: Record<string, string> = {};
  if (status !== 'all') params.status = status;
  if (search) params.search = search;

  const { data, isLoading, refetch } = useQuery(
    ['admin-orders', status, search],
    () => orderApi.getAllOrders(params).then((r) => r.data),
    { keepPreviousData: true }
  );

  const orders = data?.orders ?? [];

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus} ✅`);
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold text-espresso mb-6">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso/40" />
          <input className="input pl-9 py-2.5" placeholder="Search order number..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                status === s ? 'bg-saffron-900 text-white' : 'bg-ivory border border-warm-200 text-espresso hover:bg-warm-200'
              }`}>
              {s === 'all' ? 'All Orders' : ORDER_STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-display font-bold text-xl text-espresso">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: {
            _id: string;
            orderNumber: string;
            orderStatus: string;
            orderType: string;
            paymentMethod: string;
            paymentStatus: string;
            totalAmount: number;
            createdAt: string;
            user: { name: string; phone: string };
            items: { name: string; quantity: number }[];
          }) => {
            const sc = ORDER_STATUS_CONFIG[order.orderStatus];
            const nextStatuses = Object.keys(ORDER_STATUS_CONFIG).filter(
              (s) => s !== 'placed' && s !== 'cancelled' && s !== order.orderStatus
            );

            return (
              <div key={order._id} className="card p-4 flex flex-wrap items-center gap-4">
                <div className="text-2xl">{sc?.icon}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-espresso text-sm">#{order.orderNumber}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc?.color}`}>{sc?.label}</span>
                    <span className="text-xs text-espresso/50 capitalize">{order.orderType}</span>
                  </div>
                  <p className="text-xs text-espresso/60 mt-0.5">
                    {order.user?.name} · {order.user?.phone} · {formatDateTime(order.createdAt)}
                  </p>
                  <p className="text-xs text-espresso/50 mt-0.5 truncate">
                    {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-saffron-900">{formatCurrency(order.totalAmount)}</p>
                  <p className={`text-xs font-semibold ${order.paymentStatus === 'paid' ? 'text-leaf' : 'text-gold-700'}`}>
                    {order.paymentStatus.toUpperCase()} · {order.paymentMethod.toUpperCase()}
                  </p>
                </div>

                {/* Status updater */}
                {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                  <div className="relative">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      disabled={updating === order._id}
                      className="appearance-none pr-7 pl-3 py-2 rounded-xl border-2 border-warm-200 text-sm font-semibold text-espresso bg-white hover:border-saffron-300 focus:outline-none focus:border-saffron-900 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <option value={order.orderStatus}>{sc?.label}</option>
                      {nextStatuses.map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS_CONFIG[s]?.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso/50 pointer-events-none" />
                    {updating === order._id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                        <span className="w-4 h-4 border-2 border-saffron-900 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
