'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { settingsApi, tiffinApi, paymentApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Check, ChevronRight, Star, Clock, Truck, RefreshCw } from 'lucide-react';

const PLAN_FEATURES: Record<string, string[]> = {
  lunch:  ['Fresh lunch daily', 'Delivered by 12:30 PM', 'Dal + Sabzi + Roti + Rice', 'Seasonal vegetables'],
  dinner: ['Fresh dinner daily', 'Delivered by 8:00 PM',  'Dal + Sabzi + Roti + Rice', 'Seasonal vegetables'],
  both:   ['Lunch + Dinner daily', 'Two delivery slots', 'Dal + Sabzi + Roti + Rice', 'Best value plan'],
};

export default function TiffinPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [selected, setSelected] = useState<{ planType: string; mealType: string; price: number; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'plans' | 'form'>('plans');
  const [form, setForm] = useState({
    startDate: '',
    line1: '', area: '', pincode: '', landmark: '',
    notes: '',
  });

  const { data: settingsData } = useQuery('settings', () => settingsApi.get().then((r) => r.data));
  const plans = settingsData?.settings?.tiffinPlans ?? [];

  const handleSelectPlan = (plan: { planType: string; mealType: string; price: number; name: string }) => {
    if (!isAuthenticated) {
      toast.error('Please login to subscribe to a tiffin plan');
      router.push('/auth/login?redirect=/tiffin');
      return;
    }
    setSelected(plan);
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setLoading(true);
    try {
      const res = await tiffinApi.subscribe({
        planType: selected.planType,
        mealType: selected.mealType,
        startDate: form.startDate,
        deliveryAddress: { line1: form.line1, area: form.area, pincode: form.pincode, landmark: form.landmark },
        notes: form.notes,
      });

      const subscription = res.data.subscription;

      // Initiate Razorpay payment
      const payRes = await paymentApi.createOrder({ orderId: subscription._id, type: 'tiffin' });
      const { razorpayOrder, key } = payRes.data;

      if (typeof window !== 'undefined' && (window as unknown as { Razorpay: unknown }).Razorpay) {
        const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay({
          key,
          amount: razorpayOrder.amount,
          currency: 'INR',
          name: 'Annada Pure Veg',
          description: `${selected.name} Tiffin Plan`,
          order_id: razorpayOrder.id,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            await paymentApi.verify({
              ...response,
              orderId: subscription._id,
              type: 'tiffin',
            });
            toast.success('Tiffin subscription activated! 🍱');
            router.push('/profile/tiffin');
          },
          prefill: {},
          theme: { color: '#E65100' },
        });
        rzp.open();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const PLAN_EMOJIS: Record<string, string> = { lunch: '☀️', dinner: '🌙', both: '🌟' };

  return (
    <div className="min-h-screen bg-cream pt-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-espresso to-[#4a2010] py-14 px-4">
        <div className="container-custom text-center text-white">
          <p className="text-gold-300 font-semibold text-sm uppercase tracking-widest mb-2">Daily Delivery</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">🍱 Tiffin Service</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Ghar ka khana, rozana. Subscribe and get fresh homestyle food delivered every day.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {step === 'form' && selected ? (
          /* Subscription Form */
          <div className="max-w-xl mx-auto">
            <button onClick={() => setStep('plans')} className="btn-ghost mb-6 text-sm">
              ← Back to Plans
            </button>

            <div className="card p-6 mb-6 bg-saffron-50 border-saffron-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-saffron-900/70 uppercase tracking-wider">Selected Plan</p>
                  <p className="font-display font-bold text-espresso text-xl mt-0.5">{selected.name}</p>
                </div>
                <p className="font-display font-bold text-saffron-900 text-2xl">{formatCurrency(selected.price)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              <h2 className="font-display font-bold text-xl text-espresso">Delivery Details</h2>

              <div>
                <label className="input-label">Start Date *</label>
                <input type="date" required className="input"
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>

              <div>
                <label className="input-label">Address Line 1 *</label>
                <input type="text" required placeholder="House/Flat number, Street name" className="input"
                  value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Area *</label>
                  <select required className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                    <option value="">Select area</option>
                    {['Kharadi', 'Viman Nagar', 'Sainath Nagar', 'Wadgaon Sheri'].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Pincode *</label>
                  <input type="text" required placeholder="411014" maxLength={6} className="input"
                    value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="input-label">Landmark</label>
                <input type="text" placeholder="Near blue gate, opp. XYZ building" className="input"
                  value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
              </div>

              <div>
                <label className="input-label">Special Notes (optional)</label>
                <textarea placeholder="Any dietary preferences or delivery instructions..." rows={3} className="input resize-none"
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 text-base">
                {loading ? 'Processing...' : `Pay ${formatCurrency(selected.price)} & Subscribe 🍱`}
              </button>

              <p className="text-xs text-center text-espresso/50">
                Secure payment via Razorpay. UPI, Cards, Net Banking accepted.
              </p>
            </form>
          </div>
        ) : (
          /* Plan Selection */
          <>
            {/* Benefits */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { icon: <Clock className="w-5 h-5" />, title: 'On Time', desc: 'Delivered at your preferred time' },
                { icon: <Truck className="w-5 h-5" />, title: 'Daily Delivery', desc: 'No off days, 7 days a week' },
                { icon: <Star className="w-5 h-5" />, title: 'Fresh Food', desc: 'Cooked fresh every day' },
                { icon: <RefreshCw className="w-5 h-5" />, title: 'Pause Anytime', desc: 'Pause or cancel anytime' },
              ].map((b, i) => (
                <div key={i} className="card p-4 text-center">
                  <div className="w-10 h-10 bg-saffron-50 rounded-xl flex items-center justify-center text-saffron-900 mx-auto mb-2">
                    {b.icon}
                  </div>
                  <p className="font-semibold text-espresso text-sm">{b.title}</p>
                  <p className="text-xs text-espresso/60 mt-0.5">{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-2xl text-espresso">Choose Your Plan</h2>
              <p className="text-espresso/60 mt-1">All plans include fresh Dal, Sabzi, Roti & Rice daily</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan: { id: string; name: string; planType: string; mealType: string; price: number; description: string }) => {
                const isPopular = plan.id === 'ml'; // Monthly Lunch
                return (
                  <div key={plan.id} className={`card-hover p-6 relative flex flex-col ${isPopular ? 'ring-2 ring-saffron-900 ring-offset-2' : ''}`}>
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-saffron-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                        ⭐ Most Popular
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{PLAN_EMOJIS[plan.mealType]}</span>
                      <div>
                        <p className="font-display font-bold text-espresso text-lg">{plan.name}</p>
                        <p className="text-xs text-espresso/50 capitalize">{plan.planType} plan</p>
                      </div>
                    </div>
                    <p className="text-sm text-espresso/60 mb-4 leading-relaxed">{plan.description}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {PLAN_FEATURES[plan.mealType].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-espresso/80">
                          <Check className="w-4 h-4 text-leaf flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-warm-200">
                      <div>
                        <p className="font-display font-bold text-2xl text-saffron-900">{formatCurrency(plan.price)}</p>
                        <p className="text-xs text-espresso/50">/{plan.planType}</p>
                      </div>
                      <button onClick={() => handleSelectPlan(plan)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-saffron-900 text-white text-sm font-bold rounded-xl hover:bg-saffron-800 active:scale-95 transition-all">
                        Subscribe <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-sm text-espresso/50 mt-8">
              🌿 All tiffins are 100% pure vegetarian · No onion-garlic options available on request
            </p>
          </>
        )}
      </div>

      {/* Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
}
