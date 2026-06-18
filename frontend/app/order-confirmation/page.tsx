'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from 'react-query';
import { orderApi } from '@/lib/api';
import OrderStepper from '@/components/OrderStepper';
import { formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function OrderConfirmationPage() {
  const params  = useSearchParams();
  const orderId = params.get('orderId');
  const [countdown, setCountdown] = useState(30);

  const { data, isLoading, refetch } = useQuery(
    ['order', orderId],
    () => orderApi.getOrder(orderId!).then((r) => r.data.order),
    { enabled: !!orderId, refetchInterval: 30000 }
  );

  // Countdown to next refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { refetch(); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-saffron-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-espresso font-semibold">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!data) return (
    <div className="min-h-screen bg-cream pt-20 flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-3">😕</p>
        <p className="font-display font-bold text-xl">Order not found</p>
        <Link href="/profile/orders" className="btn-primary mt-4">My Orders</Link>
      </div>
    </div>
  );

  const statusConfig = ORDER_STATUS_CONFIG[data.orderStatus] || ORDER_STATUS_CONFIG['placed'];

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="container-custom py-8 max-w-3xl mx-auto">

        {/* Confirmation header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-bounce">
            {data.orderStatus === 'delivered' ? '🎉' : data.orderStatus === 'cancelled' ? '❌' : '✅'}
          </div>
          <h1 className="font-display text-3xl font-bold text-espresso">
            {data.orderStatus === 'delivered' ? 'Delivered!' :
             data.orderStatus === 'cancelled' ? 'Order Cancelled' :
             'Order Confirmed!'}
          </h1>
          <p className="text-espresso/60 mt-2">
            Order <span className="font-bold text-saffron-900">#{data.orderNumber}</span>
          </p>
          <p className="text-sm text-espresso/50 mt-1">{formatDateTime(data.createdAt)}</p>
        </div>

        {/* Status badge */}
        <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold w-fit mx-auto mb-8 ${statusConfig.color}`}>
          <span>{statusConfig.icon}</span> {statusConfig.label}
        </div>

        {/* Order tracker */}
        {data.orderStatus !== 'cancelled' && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-espresso">Order Status</h2>
              <div className="flex items-center gap-1.5 text-xs text-espresso/50">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Refreshing in {countdown}s
              </div>
            </div>
            <OrderStepper
              currentStatus={data.orderStatus}
              statusHistory={data.statusHistory}
              orderType={data.orderType}
            />
          </div>
        )}

        {/* Order details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <h3 className="font-semibold text-espresso text-sm mb-3 text-espresso/60 uppercase tracking-wider">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-espresso/60">Order Type</span><span className="font-semibold capitalize">{data.orderType}</span></div>
              <div className="flex justify-between"><span className="text-espresso/60">Payment</span><span className="font-semibold uppercase">{data.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-espresso/60">Payment Status</span>
                <span className={`font-semibold ${data.paymentStatus === 'paid' ? 'text-leaf' : 'text-gold-700'}`}>
                  {data.paymentStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {data.orderType === 'delivery' && data.deliveryAddress && (
            <div className="card p-5">
              <h3 className="font-semibold text-espresso text-sm mb-3 text-espresso/60 uppercase tracking-wider">Delivery Address</h3>
              <p className="text-sm text-espresso/80 leading-relaxed">
                {data.deliveryAddress.line1}<br />
                {data.deliveryAddress.area} — {data.deliveryAddress.pincode}
                {data.deliveryAddress.landmark && <><br /><span className="text-espresso/50">{data.deliveryAddress.landmark}</span></>}
              </p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-espresso mb-4">Items Ordered</h3>
          <div className="space-y-3">
            {data.items.map((item: { _id: string; name: string; price: number; quantity: number }) => (
              <div key={item._id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-espresso">{item.name}</p>
                  <p className="text-espresso/50 text-xs">{formatCurrency(item.price)} each</p>
                </div>
                <div className="text-right">
                  <p className="text-espresso/50 text-xs">×{item.quantity}</p>
                  <p className="font-bold text-saffron-900">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rangoli-divider my-4" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-espresso/60"><span>Subtotal</span><span>{formatCurrency(data.subtotal)}</span></div>
            {data.discount > 0 && <div className="flex justify-between text-leaf"><span>Discount</span><span>-{formatCurrency(data.discount)}</span></div>}
            <div className="flex justify-between text-espresso/60"><span>Delivery</span><span>{data.deliveryFee === 0 ? 'Free' : formatCurrency(data.deliveryFee)}</span></div>
            <div className="flex justify-between text-espresso/60"><span>Tax (5%)</span><span>{formatCurrency(data.tax)}</span></div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-warm-200">
            <span className="font-display font-bold text-espresso">Total Paid</span>
            <span className="font-display font-bold text-saffron-900 text-xl">{formatCurrency(data.totalAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={`/track/${data._id}`} className="btn-primary">Track Order 🛵</Link>
          <Link href="/menu" className="btn-outline">Order Again</Link>
          <Link href="/profile/orders" className="btn-ghost">All Orders</Link>
        </div>

        <p className="text-center text-xs text-espresso/50 mt-6">
          Need help? WhatsApp us at <strong>+91 98765 43210</strong>
        </p>
      </div>
    </div>
  );
}
