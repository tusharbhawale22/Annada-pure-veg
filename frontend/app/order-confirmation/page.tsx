'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from 'react-query';
import { orderApi, paymentApi } from '@/lib/api';
import OrderStepper from '@/components/OrderStepper';
import { formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { AlertCircle, CreditCard } from 'lucide-react';

function OrderConfirmationContent() {
  const params  = useSearchParams();
  const orderId = params.get('orderId');
  const [countdown, setCountdown] = useState(30);
  const { user } = useAuthStore();
  const [retrying, setRetrying] = useState(false);

  const { data, isLoading, refetch } = useQuery(
    ['order', orderId],
    () => orderApi.getOrder(orderId!).then((r) => r.data.order),
    { enabled: !!orderId, refetchInterval: 30000 }
  );

  const handleRetryPayment = async () => {
    if (!data) return;
    setRetrying(true);
    try {
      const payRes = await paymentApi.createOrder({ orderId: data._id, type: 'order' });
      const { razorpayOrder, key } = payRes.data;

      const rzp = new window.Razorpay({
        key,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'Annada Pure Veg',
        description: `Order #${data.orderNumber}`,
        order_id: razorpayOrder.id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await paymentApi.verify({ ...response, orderId: data._id, type: 'order' });
            toast.success('Payment successful! Order confirmed 🎉');
            refetch();
          } catch {
            toast.error('Payment verification failed.');
          }
        },
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: '#E65100' },
        modal: {
          ondismiss: () => {
            toast.error('Payment not completed.');
          }
        }
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to initialize payment');
    } finally {
      setRetrying(false);
    }
  };

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

        {/* Payment Warning Banner */}
        {data.paymentMethod === 'razorpay' && data.paymentStatus !== 'paid' && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm max-w-xl mx-auto">
            <div className="flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Payment Not Done</p>
                <p className="text-xs text-red-600 mt-1">
                  Your payment was not completed or was cancelled. Please complete payment to confirm your order.
                </p>
              </div>
            </div>
            <button
              onClick={handleRetryPayment}
              disabled={retrying}
              className="flex items-center justify-center gap-2 bg-red-600 text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-60 whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              {retrying ? 'Loading...' : 'Pay Now'}
            </button>
          </div>
        )}

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
                <span className={`font-semibold ${data.paymentStatus === 'paid' ? 'text-leaf' : 'text-red-500'}`}>
                  {data.paymentStatus === 'paid' ? 'PAID' : 'PAYMENT NOT DONE'}
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
            <span className="font-display font-bold text-espresso">
              {data.paymentStatus === 'paid' || data.paymentMethod === 'cod' ? 'Total Paid' : 'Total Amount'}
            </span>
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
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-saffron-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-espresso font-semibold">Loading your order...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
