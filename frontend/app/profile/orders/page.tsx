'use client';

import { useQuery } from 'react-query';
import { orderApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import Link from 'next/link';
import { Package } from 'lucide-react';

export default function MyOrdersPage() {
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery(
    'my-orders',
    () => orderApi.myOrders().then((r) => r.data.orders),
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-3">🔒</p>
          <p className="font-display font-bold text-xl mb-3">Please login to view your orders</p>
          <Link href="/auth/login?redirect=/profile/orders" className="btn-primary">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="container-custom py-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-saffron-50 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-saffron-900" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-espresso">My Orders</h1>
            <p className="text-espresso/60 text-sm">Track all your orders</p>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1,2,3].map((i) => <div key={i} className="card p-5 h-24 skeleton-shimmer" />)}
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📦</p>
            <p className="font-display font-bold text-xl text-espresso mb-2">No orders yet</p>
            <p className="text-espresso/60 text-sm mb-6">Your order history will appear here.</p>
            <Link href="/menu" className="btn-primary">Order Now →</Link>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="space-y-4">
            {data.map((order: {
              _id: string;
              orderNumber: string;
              orderStatus: string;
              createdAt: string;
              totalAmount: number;
              paymentMethod: string;
              items: { name: string; quantity: number }[];
            }) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.orderStatus] || ORDER_STATUS_CONFIG['placed'];
              return (
                <Link key={order._id} href={`/order-confirmation?orderId=${order._id}`} className="card-hover p-5 flex items-center gap-4 block">
                  <div className="text-3xl">{statusConfig.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-espresso text-sm">Order #{order.orderNumber}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-espresso/50 mb-1">{formatDateTime(order.createdAt)}</p>
                    <p className="text-xs text-espresso/60 truncate">
                      {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-saffron-900">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-espresso/50 uppercase">{order.paymentMethod}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
