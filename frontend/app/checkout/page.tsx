'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { orderApi, couponApi, paymentApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Tag, Truck, Store, CreditCard, Banknote, Check, X } from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window { Razorpay: new (opts: unknown) => { open: () => void }; }
}

export default function CheckoutPage() {
  const router  = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [orderType,  setOrderType]  = useState<'delivery' | 'pickup'>('delivery');
  const [payMethod,  setPayMethod]  = useState<'razorpay' | 'cod'>('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<{ discount: number; message: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes,   setNotes]   = useState('');

  const [address, setAddress] = useState({
    line1: user?.addresses?.[0]?.line1 || '',
    area:  user?.addresses?.[0]?.area  || '',
    pincode: user?.addresses?.[0]?.pincode || '',
    landmark: user?.addresses?.[0]?.landmark || '',
  });

  const subtotal    = getTotalPrice();
  const deliveryFee = orderType === 'pickup' ? 0 : subtotal >= 300 ? 0 : 30;
  const discount    = couponData?.discount ?? 0;
  const taxAmount   = Math.round(((subtotal - discount + deliveryFee) * 5) / 100);
  const total       = subtotal - discount + deliveryFee + taxAmount;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-3">🔒</p>
          <h2 className="font-display font-bold text-2xl text-espresso mb-2">Login Required</h2>
          <p className="text-espresso/60 mb-6">Please login to proceed to checkout.</p>
          <Link href="/auth/login?redirect=/checkout" className="btn-primary">Login Now</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-3">🛒</p>
          <h2 className="font-display font-bold text-2xl text-espresso mb-2">Cart is Empty</h2>
          <Link href="/menu" className="btn-primary mt-4">Browse Menu</Link>
        </div>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponApi.validate(couponCode, subtotal);
      setCouponData({ discount: res.data.discount, message: res.data.message });
      toast.success(res.data.message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid coupon');
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (orderType === 'delivery' && (!address.line1 || !address.area || !address.pincode)) {
      toast.error('Please fill in your delivery address');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map((i) => ({ menuItem: i._id, quantity: i.quantity })),
        orderType,
        paymentMethod: payMethod,
        deliveryAddress: orderType === 'delivery' ? address : undefined,
        couponCode: couponData ? couponCode : undefined,
        notes,
      };

      const orderRes = await orderApi.create(orderData);
      const order = orderRes.data.order;

      if (payMethod === 'cod') {
        clearCart();
        toast.success('Order placed! 🎉');
        router.push(`/order-confirmation?orderId=${order._id}`);
        return;
      }

      // Razorpay payment
      const payRes = await paymentApi.createOrder({ orderId: order._id, type: 'order' });
      const { razorpayOrder, key } = payRes.data;

      const rzp = new window.Razorpay({
        key,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'Annada Pure Veg',
        description: `Order #${order.orderNumber}`,
        order_id: razorpayOrder.id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await paymentApi.verify({ ...response, orderId: order._id, type: 'order' });
            clearCart();
            toast.success('Payment successful! Order confirmed 🎉');
            router.push(`/order-confirmation?orderId=${order._id}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: '#E65100' },
        modal: { ondismiss: () => toast('Payment cancelled. Your order is saved.', { icon: 'ℹ️' }) },
      });
      rzp.open();

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="container-custom py-8">
        <h1 className="font-display text-3xl font-bold text-espresso mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order type */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-espresso text-lg mb-4">How would you like to receive your order?</h2>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'delivery', label: 'Home Delivery', icon: <Truck className="w-5 h-5" />, desc: 'Delivered to your door' },
                  { value: 'pickup',   label: 'Self Pickup',   icon: <Store className="w-5 h-5" />, desc: 'Pick up from our store' },
                ] as const).map((opt) => (
                  <button key={opt.value} onClick={() => setOrderType(opt.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      orderType === opt.value
                        ? 'border-saffron-900 bg-saffron-50'
                        : 'border-warm-200 hover:border-saffron-300'
                    }`}>
                    <div className={`${orderType === opt.value ? 'text-saffron-900' : 'text-espresso/50'}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-espresso text-sm">{opt.label}</p>
                      <p className="text-xs text-espresso/50">{opt.desc}</p>
                    </div>
                    {orderType === opt.value && <Check className="w-4 h-4 text-saffron-900 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery address */}
            {orderType === 'delivery' && (
              <div className="card p-6">
                <h2 className="font-display font-semibold text-espresso text-lg mb-4">Delivery Address</h2>

                {/* Saved addresses */}
                {user?.addresses && user.addresses.length > 0 && (
                  <div className="mb-4">
                    <p className="input-label mb-2">Saved Addresses</p>
                    <div className="space-y-2">
                      {user.addresses.map((addr) => (
                        <button key={addr._id} onClick={() => setAddress({ line1: addr.line1, area: addr.area, pincode: addr.pincode, landmark: addr.landmark || '' })}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                            address.line1 === addr.line1 ? 'border-saffron-900 bg-saffron-50' : 'border-warm-200'
                          }`}>
                          <p className="text-sm font-semibold text-espresso">{addr.label}</p>
                          <p className="text-xs text-espresso/60">{addr.line1}, {addr.area} — {addr.pincode}</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-espresso/50 mt-2">Or enter a new address below:</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="input-label">Address *</label>
                    <input className="input" placeholder="House/Flat no., Street name" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="input-label">Area *</label>
                      <select className="input" value={address.area} onChange={(e) => setAddress({ ...address, area: e.target.value })}>
                        <option value="">Select area</option>
                        {['Kharadi', 'Viman Nagar', 'Sainath Nagar', 'Wadgaon Sheri'].map((a) => <option key={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Pincode *</label>
                      <input className="input" placeholder="411014" maxLength={6} value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Landmark</label>
                    <input className="input" placeholder="Near blue gate, opp. ABC building" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Payment method */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-espresso text-lg mb-4">Payment Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { value: 'razorpay', label: 'UPI / Card / Net Banking', icon: <CreditCard className="w-5 h-5" />, desc: 'Razorpay — Secure & instant' },
                  { value: 'cod',      label: 'Cash on Delivery',         icon: <Banknote className="w-5 h-5" />,   desc: 'Pay when you receive' },
                ] as const).map((opt) => (
                  <button key={opt.value} onClick={() => setPayMethod(opt.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      payMethod === opt.value ? 'border-saffron-900 bg-saffron-50' : 'border-warm-200 hover:border-saffron-300'
                    }`}>
                    <div className={payMethod === opt.value ? 'text-saffron-900' : 'text-espresso/50'}>{opt.icon}</div>
                    <div>
                      <p className="font-semibold text-espresso text-sm">{opt.label}</p>
                      <p className="text-xs text-espresso/50">{opt.desc}</p>
                    </div>
                    {payMethod === opt.value && <Check className="w-4 h-4 text-saffron-900 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Special instructions */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-espresso text-lg mb-3">Special Instructions</h2>
              <textarea className="input resize-none" rows={3} placeholder="Any special requests or notes for your order..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Right — Order Summary */}
          <div className="space-y-4">
            {/* Items */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-espresso text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item._id} className="flex justify-between items-center text-sm">
                    <span className="text-espresso/80 flex-1 truncate">{item.name} × {item.quantity}</span>
                    <span className="font-semibold text-espresso ml-2">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="border-t border-warm-200 pt-4 mb-4">
                <label className="input-label flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Coupon Code</label>
                <div className="flex gap-2 mt-1">
                  <input className="input flex-1 py-2.5" placeholder="WELCOME10" value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponData(null); }}
                    disabled={!!couponData} />
                  {couponData ? (
                    <button onClick={() => { setCouponData(null); setCouponCode(''); }} className="px-3 rounded-xl border-2 border-warm-200 hover:border-red-300 text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-4 py-2.5 bg-espresso text-white text-sm font-bold rounded-xl hover:bg-espresso/90 disabled:opacity-50 transition-all">
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  )}
                </div>
                {couponData && (
                  <p className="text-xs text-leaf font-semibold mt-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3" /> {couponData.message}
                  </p>
                )}
              </div>

              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-espresso/70"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-leaf"><span>Coupon Discount</span><span>-{formatCurrency(discount)}</span></div>}
                <div className="flex justify-between text-espresso/70">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-leaf font-semibold' : ''}>
                    {deliveryFee === 0 ? (orderType === 'pickup' ? 'Self Pickup' : 'FREE 🎉') : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-espresso/70"><span>GST (5%)</span><span>{formatCurrency(taxAmount)}</span></div>
              </div>

              <div className="rangoli-divider my-4" />

              <div className="flex justify-between items-center mb-5">
                <p className="font-display font-bold text-espresso text-lg">Total</p>
                <p className="font-display font-bold text-saffron-900 text-2xl">{formatCurrency(total)}</p>
              </div>

              <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary w-full justify-center py-4 text-base">
                {loading ? 'Placing Order...' : payMethod === 'cod' ? '🛵 Place Order' : '💳 Pay & Order'}
              </button>

              <p className="text-xs text-center text-espresso/50 mt-3">
                🌿 By placing an order, you agree to our delivery terms.
              </p>
            </div>
          </div>
        </div>
      </div>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
}
