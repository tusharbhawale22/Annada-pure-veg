'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { settingsApi, tiffinApi, paymentApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Check, ChevronRight } from 'lucide-react';

const PLAN_FEATURES: Record<string, string[]> = {
  lunch:  ['Fresh lunch daily', 'Delivered by 12:30 PM', 'Dal + Sabzi + Roti + Rice', 'Seasonal vegetables'],
  dinner: ['Fresh dinner daily', 'Delivered by 6:00 PM',  'Dal + Sabzi + Roti + Rice', 'Seasonal vegetables'],
  both:   ['Lunch + Dinner daily', 'Two delivery slots', 'Dal + Sabzi + Roti + Rice', 'Best value plan'],
};

const PLAN_EMOJIS: Record<string, string> = { lunch: '☀️', dinner: '🌙', both: '✨' };

const BENEFITS = [
  {
    title: 'On Time',
    desc: 'Delivered at your preferred time',
    img: '/images/on-time.png',
  },
  {
    title: 'Daily Delivery',
    desc: 'No off days, 7 days a week',
    img: '/images/daily-delivery.png',
  },
  {
    title: 'Fresh Food',
    desc: 'Cooked fresh every day',
    img: '/images/fresh-food.png',
  },
  {
    title: 'Pause Anytime',
    desc: 'Pause or cancel anytime',
    img: '/images/pause-anytime.png',
  },
];

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
          modal: {
            ondismiss: async () => {
              try {
                await paymentApi.cancel({ orderId: subscription._id, type: 'tiffin' });
              } catch (err) {
                console.error('Error reporting cancellation:', err);
              }
              toast.error('Payment not done. Subscription saved.');
              router.push('/profile/tiffin');
            }
          }
        });
        rzp.open();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5ED] pt-20">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-b from-[#3D1000] to-[#6B2200] py-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-2xl mx-auto text-center text-white relative z-10">
          <p className="text-[#FFD700] font-bold text-xs uppercase tracking-[0.3em] mb-3">DAILY DELIVERY</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-3">
            <span className="text-4xl">🍱</span> Tiffin Service
          </h1>
          <p className="text-white/75 text-base md:text-lg leading-relaxed">
            Ghar ka khana, rozana. Subscribe and get fresh homestyle food<br className="hidden md:block" /> delivered every day.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {step === 'form' && selected ? (
          /* ── Subscription Form ── */
          <div className="max-w-xl mx-auto">
            <button onClick={() => setStep('plans')} className="flex items-center gap-1 text-sm text-espresso/60 hover:text-espresso mb-6 font-medium transition-colors">
              ← Back to Plans
            </button>

            <div className="bg-[#FFF0E5] border border-[#E65100]/20 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-[#E65100] uppercase tracking-wider">Selected Plan</p>
                  <p className="font-display font-bold text-espresso text-xl mt-0.5">{selected.name}</p>
                </div>
                <p className="font-display font-bold text-[#E65100] text-2xl">{formatCurrency(selected.price)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-warm-100 p-6 space-y-4">
              <h2 className="font-display font-bold text-xl text-espresso">Delivery Details</h2>

              <div>
                <label className="block text-xs font-semibold text-espresso/70 uppercase tracking-wide mb-1.5">Start Date *</label>
                <input type="date" required className="w-full border border-warm-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30"
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso/70 uppercase tracking-wide mb-1.5">Address Line 1 *</label>
                <input type="text" required placeholder="House/Flat number, Street name" className="w-full border border-warm-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30"
                  value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-espresso/70 uppercase tracking-wide mb-1.5">Area *</label>
                  <input type="text" required placeholder="e.g. Kharadi" className="w-full border border-warm-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30"
                    value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-espresso/70 uppercase tracking-wide mb-1.5">Pincode *</label>
                  <input type="text" required placeholder="411014" maxLength={6} className="w-full border border-warm-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30"
                    value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso/70 uppercase tracking-wide mb-1.5">Landmark</label>
                <input type="text" placeholder="Near blue gate, opp. XYZ building" className="w-full border border-warm-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30"
                  value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso/70 uppercase tracking-wide mb-1.5">Special Notes (optional)</label>
                <textarea placeholder="Any dietary preferences or delivery instructions..." rows={3} className="w-full border border-warm-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/30 resize-none"
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#E65100] text-white font-bold rounded-xl text-base hover:bg-[#C84B00] active:scale-[0.98] transition-all shadow-lg hover:shadow-xl disabled:opacity-60">
                {loading ? 'Processing...' : `Pay ${formatCurrency(selected.price)} & Subscribe 🍱`}
              </button>

              <p className="text-xs text-center text-espresso/50">
                Secure payment via Razorpay. UPI, Cards, Net Banking accepted.
              </p>
            </form>
          </div>

        ) : (
          /* ── Plan Selection ── */
          <>
            {/* ── Benefits ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {BENEFITS.map((b, i) => (
                <div key={i} className="bg-[#FDF0E6] rounded-2xl p-5 flex flex-col items-center text-center border border-[#F5DCC8] hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="w-24 h-24 mb-3 relative flex-shrink-0">
                    <Image
                      src={b.img}
                      alt={b.title}
                      fill
                      sizes="96px"
                      className="object-contain drop-shadow-md"
                    />
                  </div>
                  <p className="font-bold text-[#3D1000] text-sm">{b.title}</p>
                  <p className="text-xs text-[#7B4B2A] mt-1 leading-snug">{b.desc}</p>
                </div>
              ))}
            </div>

            {/* ── Plans Heading ── */}
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-3xl text-[#2C1005]">Choose Your Plan</h2>
              <p className="text-[#7B4B2A] mt-2 text-sm">All plans include fresh Dal, Sabzi, Roti & Rice daily</p>
            </div>

            {/* ── Plan Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {plans.filter((p: any) => p.isAvailable !== false).map((plan: { id: string; name: string; planType: string; mealType: string; price: number; description: string; numberOfDays?: number; deliveryTime?: string; foodItems?: string; isAvailable?: boolean }) => {
                const isPopular = plan.planType === 'monthly';

                return (
                  <div key={plan.id} className={`relative bg-white rounded-2xl p-6 flex flex-col border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                    isPopular ? 'border-[#E65100]' : 'border-[#F0E0D0]'
                  }`}>

                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E65100] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
                        ⭐ Most Popular
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-[#FFF3E0]">
                        {PLAN_EMOJIS[plan.mealType]}
                      </div>
                      <div>
                        <p className="font-display font-bold text-[#2C1005] text-lg leading-tight">{plan.name}</p>
                        <p className="text-xs text-[#9B6B4A] capitalize">{plan.planType} Plan</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#7B4B2A]/80 mb-4 leading-relaxed">{plan.description}</p>

                    {/* Features */}
                    <ul className="space-y-2 mb-6 flex-1">
                      <li className="flex items-center gap-2 text-sm text-[#5C3317]">
                        <Check className="w-4 h-4 text-[#E65100] flex-shrink-0" />
                        Duration: {plan.numberOfDays || (plan.planType === 'weekly' ? 7 : 30)} days
                      </li>
                      {plan.deliveryTime && (
                        <li className="flex items-center gap-2 text-sm text-[#5C3317]">
                          <Check className="w-4 h-4 text-[#E65100] flex-shrink-0" />
                          Delivery Time: {plan.deliveryTime}
                        </li>
                      )}
                      <li className="flex items-center gap-2 text-sm text-[#5C3317]">
                        <Check className="w-4 h-4 text-[#E65100] flex-shrink-0" />
                        {plan.foodItems || 'Dal + Sabzi + Roti + Rice'}
                      </li>
                      <li className="flex items-center gap-2 text-sm text-[#5C3317]">
                        <Check className="w-4 h-4 text-[#E65100] flex-shrink-0" />
                        {plan.mealType === 'both' ? 'Best value plan' : 'Fresh food daily'}
                      </li>
                    </ul>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#F5DCC8]">
                      <div>
                        <p className="font-display font-bold text-2xl text-[#E65100]">&#8377;{plan.price}</p>
                        <p className="text-xs text-[#9B6B4A]">/{plan.planType}</p>
                      </div>
                      <button onClick={() => handleSelectPlan(plan)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-[#E65100] text-white text-sm font-bold rounded-xl hover:bg-[#C84B00] active:scale-95 transition-all shadow-md hover:shadow-lg">
                        Subscribe <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-sm text-espresso/50 pb-10">
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
