'use client';

import { useQuery, useQueryClient } from 'react-query';
import { useState } from 'react';
import { orderApi, reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import Link from 'next/link';
import { Package, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyOrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery(
    'my-orders',
    () => orderApi.myOrders().then((r) => r.data.orders),
    { enabled: isAuthenticated }
  );

  const openReviewModal = (e: React.MouseEvent, orderId: string) => {
    e.preventDefault(); // Prevent navigating to order details
    setSelectedOrderId(orderId);
    setRating(5);
    setComment('');
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!comment.trim()) {
      toast.error('Please write a short review.');
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewsApi.addReview({ orderId: selectedOrderId, rating, comment });
      toast.success('Thank you for your feedback! 🌟');
      setReviewModalOpen(false);
      queryClient.invalidateQueries('my-orders');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              hasReviewed?: boolean;
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
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <p className="font-display font-bold text-saffron-900">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-espresso/50 uppercase mb-2">{order.paymentMethod}</p>
                    
                    {order.orderStatus === 'delivered' && !order.hasReviewed && (
                      <button
                        onClick={(e) => openReviewModal(e, order._id)}
                        className="text-xs bg-saffron-900 text-white px-3 py-1.5 rounded-lg hover:bg-saffron-800 transition-colors shadow-sm font-semibold"
                      >
                        Rate Order 🌟
                      </button>
                    )}
                    {order.orderStatus === 'delivered' && order.hasReviewed && (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md">Reviewed ✓</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Review Modal ── */}
        {reviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-warm-xl w-full max-w-md overflow-hidden animate-slide-in-up">
              <div className="p-4 border-b border-warm-200 flex items-center justify-between bg-cream">
                <h3 className="font-display font-bold text-lg text-espresso">Rate Your Order</h3>
                <button onClick={() => setReviewModalOpen(false)} className="text-espresso/50 hover:text-espresso transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-espresso mb-2">How was the food?</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-3xl transition-transform hover:scale-110 ${star <= rating ? 'text-gold-400 drop-shadow-sm' : 'text-warm-300 grayscale opacity-50'}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-espresso mb-1 block">Your Feedback</label>
                  <textarea
                    className="input min-h-[100px] resize-y text-sm"
                    placeholder="Tell us what you liked..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <button
                  onClick={submitReview}
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 text-base"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
