'use client';

import { useParams } from 'next/navigation';
import { useQuery } from 'react-query';
import { orderApi } from '@/lib/api';
import OrderStepper from '@/components/OrderStepper';
import { formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';

export default function OrderTrackPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [countdown, setCountdown] = useState(30);

  const { data: order, isLoading, refetch } = useQuery(
    ['track-order', orderId],
    () => orderApi.getOrder(orderId).then((r) => r.data.order),
    { enabled: !!orderId, refetchInterval: 30000 }
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { refetch(); return 30; } return c - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-saffron-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-espresso">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-3">😕</p>
          <p className="font-display font-bold text-xl text-espresso">Order not found</p>
          <Link href="/profile/orders" className="btn-primary mt-4">My Orders</Link>
        </div>
      </div>
    );
  }

  const sc = ORDER_STATUS_CONFIG[order.orderStatus];

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="container-custom py-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-5xl mb-2">{sc?.icon}</p>
          <h1 className="font-display text-2xl font-bold text-espresso">Order #{order.orderNumber}</h1>
          <p className="text-espresso/60 text-sm mt-1">{formatDateTime(order.createdAt)}</p>
          <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl text-sm font-bold ${sc?.color}`}>
            {sc?.icon} {sc?.label}
          </div>
        </div>

        {/* Auto-refresh indicator */}
        {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
          <div className="flex items-center justify-center gap-2 text-xs text-espresso/50 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Auto-refreshing in {countdown}s
          </div>
        )}

        {/* Stepper */}
        <div className="card p-6 mb-5">
          <h2 className="font-display font-semibold text-espresso mb-4">Live Tracking</h2>
          <OrderStepper
            currentStatus={order.orderStatus}
            statusHistory={order.statusHistory}
            orderType={order.orderType}
          />
          {order.estimatedDeliveryTime && (
            <p className="text-center text-sm text-espresso/60 mt-4">
              ⏱ Estimated delivery: <strong className="text-espresso">{order.estimatedDeliveryTime}</strong>
            </p>
          )}
        </div>

        {/* Items */}
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-espresso mb-3">Your Order</h2>
          <div className="space-y-2">
            {order.items.map((item: { _id: string; name: string; price: number; quantity: number }) => (
              <div key={item._id} className="flex justify-between text-sm">
                <span>{item.name} <span className="text-espresso/50">×{item.quantity}</span></span>
                <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-warm-200">
            <span className="font-semibold text-espresso">Total</span>
            <span className="font-display font-bold text-saffron-900 text-lg">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Help */}
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <Phone className="w-5 h-5 text-[#25D366]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-espresso text-sm">Need help with your order?</p>
            <p className="text-xs text-espresso/60">Contact us on WhatsApp for instant support</p>
          </div>
          <a href={`https://wa.me/919876543210?text=Hi! My order number is ${order.orderNumber}`}
            target="_blank" rel="noopener noreferrer"
            className="px-3 py-2 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity">
            WhatsApp
          </a>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <Link href="/menu" className="btn-outline text-sm">Order Again</Link>
          <Link href="/profile/orders" className="btn-ghost text-sm">All Orders</Link>
        </div>
      </div>
    </div>
  );
}
