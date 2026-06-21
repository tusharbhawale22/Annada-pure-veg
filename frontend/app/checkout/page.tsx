'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { orderApi, couponApi, paymentApi, authApi, settingsApi } from '@/lib/api';
import { useQuery } from 'react-query';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Tag, Truck, Store, CreditCard, Banknote, Check, X, MapPin, Plus, ChevronDown } from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window { Razorpay: new (opts: unknown) => { open: () => void }; }
}

interface AddressForm {
  line1: string;
  area: string;
  pincode: string;
  landmark: string;
}

export default function CheckoutPage() {
  const router  = useRouter();
  const { items, getTotalPrice, clearCart, removeItem } = useCartStore();
  const { user, isAuthenticated, updateUser } = useAuthStore();

  const { data: settings } = useQuery('settings', () =>
    settingsApi.get().then((r) => r.data.settings)
  );

  const [orderType,  setOrderType]  = useState<'delivery' | 'pickup'>('delivery');
  const [payMethod,  setPayMethod]  = useState<'razorpay' | 'cod'>('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<{ discount: number; message: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes,   setNotes]   = useState('');

  // Clean up any mock items from cart to prevent invalid checkout submission
  useEffect(() => {
    const hasMock = items.some(i => i._id.startsWith('mock_'));
    if (hasMock) {
      items.forEach(i => {
        if (i._id.startsWith('mock_')) {
          removeItem(i._id);
        }
      });
      toast.error('Removed invalid mockup items from your cart.');
    }
  }, [items, removeItem]);

  // Address state
  const savedAddresses = user?.addresses || [];
  const hasSavedAddress = savedAddresses.length > 0;

  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>(
    hasSavedAddress ? savedAddresses[0]._id : 'new'
  );
  const [showNewForm, setShowNewForm]   = useState(!hasSavedAddress);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressForm>({
    line1: '', area: '', pincode: '', landmark: '',
  });

  // Derive the actual delivery address to use
  const activeAddress: AddressForm | null = (() => {
    if (selectedAddressId === 'new') return newAddress;
    const saved = savedAddresses.find((a) => a._id === selectedAddressId);
    return saved ? { line1: saved.line1, area: saved.area, pincode: saved.pincode, landmark: saved.landmark || '' } : null;
  })();

  const subtotal    = getTotalPrice();

  const deliveryAreas = settings?.deliveryAreas ?? ['Kharadi', 'Viman Nagar', 'Sainath Nagar', 'Wadgaon Sheri'];
  const defaultFreeDeliveryAbove = settings?.freeDeliveryAbove ?? 300;
  const defaultDeliveryFee = settings?.deliveryFee ?? 30;

  const isEligibleForFreeDelivery = (() => {
    if (orderType === 'pickup') return false;
    if (!activeAddress || !activeAddress.area) return false;
    const targetArea = activeAddress.area.trim().toLowerCase();
    return deliveryAreas.some((a: string) => a.trim().toLowerCase() === targetArea);
  })();

  const deliveryFee = orderType === 'pickup'
    ? 0
    : (isEligibleForFreeDelivery && subtotal >= defaultFreeDeliveryAbove)
      ? 0
      : defaultDeliveryFee;

  const discount    = couponData?.discount ?? 0;
  const taxAmount   = Math.round(((subtotal - discount + deliveryFee) * (settings?.taxRate ?? 5)) / 100);
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
    if (orderType === 'delivery') {
      if (!activeAddress?.line1 || !activeAddress?.area || !activeAddress?.pincode) {
        toast.error('Please fill in your delivery address');
        return;
      }
    }

    setLoading(true);
    try {
      // Save new address to profile if checkbox ticked
      if (selectedAddressId === 'new' && saveToProfile && newAddress.line1 && newAddress.area && newAddress.pincode) {
        try {
          const res = await authApi.addAddress({ label: 'Home', ...newAddress });
          updateUser({ addresses: res.data.addresses });
          toast.success('Address saved to your profile 🏡');
        } catch {
          // Non-fatal — proceed with order
        }
      }

      const orderData = {
        items: items.map((i) => ({ menuItem: i._id, quantity: i.quantity })),
        orderType,
        paymentMethod: payMethod,
        deliveryAddress: orderType === 'delivery' ? activeAddress : undefined,
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
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.includes('Menu item') && errMsg.includes('not found')) {
        const match = errMsg.match(/Menu item ([a-f0-9]{24}) not found/i);
        if (match && match[1]) {
          removeItem(match[1]);
          toast.error('Removed stale menu item from your cart. Please try again.');
          setLoading(false);
          return;
        }
      }
      toast.error(errMsg || 'Could not place order');
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
                <h2 className="font-display font-semibold text-espresso text-lg mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-saffron-900" />
                  Delivery Address
                </h2>

                {/* ── Saved addresses (auto-selected) ── */}
                {hasSavedAddress && (
                  <div className="space-y-2 mb-4">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr._id}
                        onClick={() => { setSelectedAddressId(addr._id); setShowNewForm(false); }}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                          selectedAddressId === addr._id && !showNewForm
                            ? 'border-saffron-900 bg-saffron-50'
                            : 'border-warm-200 hover:border-saffron-300'
                        }`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          selectedAddressId === addr._id && !showNewForm
                            ? 'border-saffron-900 bg-saffron-900'
                            : 'border-warm-400'
                        }`}>
                          {selectedAddressId === addr._id && !showNewForm && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-espresso">{addr.label}</span>
                            <span className="text-xs bg-saffron-100 text-saffron-900 px-2 py-0.5 rounded-full font-medium">Saved</span>
                          </div>
                          <p className="text-sm text-espresso/70">{addr.line1}</p>
                          <p className="text-xs text-espresso/50">{addr.area} — {addr.pincode}{addr.landmark ? ` · near ${addr.landmark}` : ''}</p>
                        </div>
                        {selectedAddressId === addr._id && !showNewForm && (
                          <Check className="w-4 h-4 text-saffron-900 flex-shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}

                    {/* Use different address toggle */}
                    <button
                      onClick={() => { setShowNewForm(!showNewForm); if (!showNewForm) setSelectedAddressId('new'); else setSelectedAddressId(savedAddresses[0]._id); }}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        showNewForm ? 'border-saffron-900 bg-saffron-50' : 'border-dashed border-warm-300 hover:border-saffron-300'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        showNewForm ? 'border-saffron-900 bg-saffron-900' : 'border-warm-400'
                      }`}>
                        {showNewForm && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <Plus className="w-4 h-4 text-espresso/50" />
                      <span className="text-sm font-semibold text-espresso/70">Use a different address</span>
                    </button>
                  </div>
                )}

                {/* ── New address form ── */}
                {(!hasSavedAddress || showNewForm) && (
                  <div className="space-y-3 mt-2">
                    {!hasSavedAddress && (
                      <p className="text-xs text-espresso/50 bg-warm-100 rounded-xl p-3 border border-warm-200">
                        💡 <strong>Tip:</strong> Add your address once during registration and it'll be auto-filled here every time!
                      </p>
                    )}

                    <div>
                      <label className="input-label">Address *</label>
                      <input className="input" placeholder="House/Flat no., Street name" value={newAddress.line1}
                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="input-label">Area *</label>
                        <input className="input" placeholder="e.g. Kharadi" value={newAddress.area}
                          onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })} />
                      </div>
                      <div>
                        <label className="input-label">Pincode *</label>
                        <input className="input" placeholder="411014" maxLength={6} value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Landmark</label>
                      <input className="input" placeholder="Near blue gate, opp. ABC building" value={newAddress.landmark}
                        onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })} />
                    </div>

                    {/* Save to profile checkbox */}
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-saffron-50 border border-saffron-100 cursor-pointer hover:bg-saffron-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={saveToProfile}
                        onChange={(e) => setSaveToProfile(e.target.checked)}
                        className="w-4 h-4 accent-saffron-900 rounded"
                      />
                      <div>
                        <p className="text-sm font-semibold text-espresso">Save this address to my profile</p>
                        <p className="text-xs text-espresso/50">Auto-fill next time — no need to type again</p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Preview of selected address (when saved address is selected) */}
                {hasSavedAddress && !showNewForm && activeAddress && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-green-800">Delivering to your saved address</p>
                      <p className="text-xs text-green-700">{activeAddress.line1}, {activeAddress.area} — {activeAddress.pincode}</p>
                    </div>
                  </div>
                )}
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
              <textarea className="input resize-none" rows={3} placeholder="Any special requests or notes for your order..." value={notes}
                onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Right — Order Summary */}
          <div className="space-y-4">
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
