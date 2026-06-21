import type { Metadata } from 'next';
import Link from 'next/link';
import { Leaf, Clock, Truck, ShieldCheck, Star, MapPin, Phone, ChevronRight, ArrowRight } from 'lucide-react';
import SpiceParticles from '@/components/SpiceParticles';
import HeroFoodCards from '@/components/HeroFoodCards';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Annada Pure Veg — Fresh Homestyle Breakfast & Tiffin in Pune',
  description: 'Order fresh pure vegetarian breakfast and tiffin delivered warm to your door. Wadgaon Sheri, Pune. No preservatives. Just honest food.',
};

const features = [
  { icon: '🌿', title: 'Zero Preservatives', desc: 'Cooked fresh every morning. No chemicals, no shortcuts — just honest ingredients.' },
  { icon: '🏡', title: 'Home Delivery', desc: 'Delivered warm to Kharadi, Viman Nagar & Sainath Nagar. Free on orders above ₹300.' },
  { icon: '🍱', title: 'Tiffin Service', desc: 'Subscribe weekly or monthly. Daily lunch &amp; dinner at your doorstep.' },
  { icon: '💯', title: 'Always Pure Veg', desc: 'We are a 100% vegetarian kitchen — always, without exception.' },
];

// We will fetch testimonials dynamically now
// const testimonials = [ ... ];

// Removed old menuHighlights as it's now handled by HeroFoodCards

export default async function HomePage() {
  // Fetch real reviews
  let testimonials = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reviews`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        testimonials = json.data;
      }
    }
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
  }

  // Fallback if no reviews yet
  if (testimonials.length === 0) {
    testimonials = [
      {
        name: 'Priya Kulkarni',
        area: 'Viman Nagar',
        rating: 5,
        text: "Best poha in Pune, hands down! I've been ordering breakfast from Annada for 6 months and it never disappoints. Tastes exactly like mum's cooking.",
        avatar: '👩',
      }
    ];
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          HERO SECTION — Split layout with food showcase
      ═══════════════════════════════════════════════════ */}
      <section 
        className="relative min-h-screen flex items-center overflow-hidden bg-[#E65100]"
        style={{ 
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}
      >
        {/* Glow behind text */}
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-[#FFA000]/30 rounded-full blur-[100px]" />
        
        {/* Absolute Background Food Imagery (Left side) */}
        <div className="absolute top-10 -left-20 w-[400px] h-[400px] opacity-80 blur-[2px] animate-pulse">
          <Image
            src="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400&h=400"
            alt="Poha"
            fill
            sizes="400px"
            priority
            className="object-cover rounded-full mix-blend-luminosity"
          />
        </div>
        <div className="absolute bottom-10 -left-32 w-[500px] h-[500px] opacity-90 blur-[1px]">
          <Image
            src="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=500&h=500"
            alt="Idli"
            fill
            sizes="500px"
            priority
            className="object-cover rounded-full"
          />
        </div>
        <SpiceParticles />

        {/* Content Grid */}
        <div className="container-custom relative z-10 pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">

            {/* Left — Text Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6 animate-fade-in">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                🌿 100% Pure Vegetarian · Wadgaon Sheri, Pune
              </div>

              {/* Headline */}
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4 animate-slide-in-up">
                Annada{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-yellow-200">
                  Pure Veg
                </span>
              </h1>

              {/* Tagline */}
              <p className="font-display text-xl md:text-2xl text-white/80 italic mb-4 animate-slide-in-up">
                "Ghar Jaisi Subah, Har Subah"
              </p>

              <p className="text-white/65 text-base leading-relaxed mb-8 max-w-xl animate-fade-in">
                Fresh homestyle breakfast cooked every morning and delivered warm to your door.
                No preservatives. No shortcuts. Just pure, honest food.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4 mb-10 animate-slide-in-up">
                <Link href="/menu"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-base rounded-full hover:bg-white/30 transition-all active:scale-95 shadow-lg">
                  Order Now 🛒
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link href="/tiffin"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold text-base rounded-full border border-white/20 hover:bg-white/20 transition-all active:scale-95 shadow-sm">
                  🍱 Tiffin Plans
                </Link>
              </div>

              {/* Social proof stats */}
              <div className="flex items-center gap-6 animate-fade-in">
                <div className="text-center">
                  <p className="font-display font-bold text-3xl text-gold-400">500+</p>
                  <p className="text-white/55 text-xs font-medium">Happy Customers</p>
                </div>
                <div className="w-px h-12 bg-white/15" />
                <div className="text-center">
                  <p className="font-display font-bold text-3xl text-gold-400">4.5 ⭐</p>
                  <p className="text-white/55 text-xs font-medium">Average Rating</p>
                </div>
                <div className="w-px h-12 bg-white/15" />
                <div className="text-center">
                  <p className="font-display font-bold text-3xl text-gold-400">3+</p>
                  <p className="text-white/55 text-xs font-medium">Years Serving</p>
                </div>
              </div>
            </div>

            {/* Right — Food Showcase Cards */}
            <HeroFoodCards />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <p className="text-white/60 text-[10px] font-medium tracking-widest uppercase">Scroll to explore</p>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>


      </section>

      {/* ═══════════════════════════════════════════════════
          TRUST STRIP
      ═══════════════════════════════════════════════════ */}
      <section className="bg-saffron-900 py-4">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/90 text-sm font-semibold">
            <span className="flex items-center gap-2">🌿 100% Pure Vegetarian</span>
            <span className="hidden sm:block text-white/30">|</span>
            <span className="flex items-center gap-2">🚫 No Preservatives</span>
            <span className="hidden sm:block text-white/30">|</span>
            <span className="flex items-center gap-2">🏡 Home Delivery Available</span>
            <span className="hidden sm:block text-white/30">|</span>
            <span className="flex items-center gap-2">⏰ Fresh Every Morning</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          WHY CHOOSE US
      ═══════════════════════════════════════════════════ */}
      <section className="section bg-ivory">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-saffron-900 font-semibold text-sm uppercase tracking-widest mb-2">Why Choose Us</p>
            <h2 className="section-title">Why Pune Loves Annada</h2>
            <p className="section-subtitle">The difference you taste in every bite</p>
            <div className="rangoli-divider max-w-xs mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card-hover p-6 text-center group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-saffron-900/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-espresso text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-espresso/60 leading-relaxed" dangerouslySetInnerHTML={{ __html: f.desc }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          POPULAR ITEMS SHOWCASE
      ═══════════════════════════════════════════════════ */}
      <section className="section bg-cream">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-saffron-900 font-semibold text-sm uppercase tracking-widest mb-2">Our Menu</p>
            <h2 className="section-title">What's Cooking Today?</h2>
            <p className="section-subtitle">Freshly prepared, lovingly served</p>
            <div className="rangoli-divider max-w-xs mx-auto mt-4" />
          </div>

          <div className="text-center mt-10">
            <Link href="/menu" className="btn-primary text-base px-8 py-3.5">
              View Full Menu — 21+ Dishes →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TIFFIN PROMO BANNER
      ═══════════════════════════════════════════════════ */}
      <section className="section bg-gradient-to-br from-[#7C1D00] via-saffron-900 to-[#3D1000] relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold-400/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="container-custom relative z-10">
          <div className="max-w-2xl mx-auto text-center text-white">
            <div className="text-6xl mb-4">🍱</div>
            <p className="font-display text-sm font-bold text-gold-300 uppercase tracking-widest mb-3">
              Tiffin Subscription
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ghar ka Khana, Rozana
            </h2>
            <p className="text-white/75 text-lg leading-relaxed mb-8">
              Subscribe to our weekly or monthly tiffin plan and get fresh,
              homestyle lunch &amp; dinner delivered every single day.
              Starting at just <strong className="text-gold-300">₹350/week</strong>.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { label: 'Weekly Lunch', price: '₹350' },
                { label: 'Weekly Dinner', price: '₹350' },
                { label: 'Monthly Both', price: '₹2,400' },
              ].map((p) => (
                <div key={p.label} className="bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 rounded-xl text-center">
                  <p className="text-white font-bold text-sm">{p.label}</p>
                  <p className="text-gold-300 font-bold text-lg">{p.price}</p>
                </div>
              ))}
            </div>

            <Link href="/tiffin"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-saffron-900 font-bold text-base rounded-2xl hover:bg-cream transition-all active:scale-95 shadow-warm-lg">
              Subscribe Now 🍱
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════ */}
      <section className="section bg-ivory">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-saffron-900 font-semibold text-sm uppercase tracking-widest mb-2">Reviews</p>
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Real reviews from our daily regulars</p>
            <div className="rangoli-divider max-w-xs mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t: any, i: number) => (
              <div key={i} className="card p-6 relative hover:shadow-warm-lg transition-shadow duration-300">
                <div className="absolute top-4 right-5 font-display text-7xl text-saffron-900/8 leading-none font-bold select-none">"</div>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating || 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold-800 text-gold-800" />
                  ))}
                </div>
                <p className="text-espresso/80 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-saffron-gradient rounded-full flex items-center justify-center text-xl">
                    {t.avatar || '👤'}
                  </div>
                  <div>
                    <p className="font-bold text-espresso text-sm">{t.name}</p>
                    <p className="text-xs text-espresso/50 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t.area}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TIMINGS & MAP
      ═══════════════════════════════════════════════════ */}
      <section className="section bg-cream">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-saffron-900 font-semibold text-sm uppercase tracking-widest mb-2">Find Us</p>
            <h2 className="section-title">Visit Us or Order Online</h2>
            <p className="section-subtitle">We're open 7 days a week</p>
            <div className="rangoli-divider max-w-xs mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="card p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-saffron-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-saffron-900" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-espresso mb-1">Our Location</h3>
                  <p className="text-espresso/70 text-sm leading-relaxed">
                    HW2G+R2F, Mate Nagar,<br />
                    Wadgaon Sheri, Pune, Maharashtra 411014
                  </p>
                  <a href="https://www.google.com/maps/dir/?api=1&destination=Annada+Pure+Veg,+Wadgaon+Sheri,+Pune"
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-saffron-900 text-sm font-semibold hover:underline">
                    Get Directions →
                  </a>
                </div>
              </div>

              <div className="rangoli-divider" />

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-gold-700" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-espresso mb-3">Store Hours</h3>
                  <div className="space-y-1.5">
                    {[
                      { days: 'Mon – Sat', time: '7:00 AM – 10:00 PM' },
                      { days: 'Sunday',    time: '7:00 AM – 9:00 PM' },
                    ].map((t) => (
                      <div key={t.days} className="flex justify-between text-sm">
                        <span className="text-espresso/60 font-medium">{t.days}</span>
                        <span className="font-bold text-espresso">{t.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rangoli-divider" />

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-leaf/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-leaf" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-espresso mb-1">Call Us</h3>
                  <a href="tel:+919876543210" className="text-saffron-900 font-bold text-lg hover:underline">
                    +91 98765 43210
                  </a>
                </div>
              </div>

              <div className="bg-saffron-50 rounded-xl p-4 border border-saffron-100">
                <p className="font-bold text-saffron-900 text-sm mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Delivery Areas
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Kharadi', 'Viman Nagar', 'Sainath Nagar', 'Wadgaon Sheri'].map((area) => (
                    <span key={area} className="text-xs bg-white text-saffron-900 font-semibold px-2.5 py-1 rounded-lg border border-saffron-200">
                      {area}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-saffron-900/70 mt-2 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Free delivery on orders above ₹300
                </p>
              </div>
            </div>

            {/* Google Maps embed */}
            <div className="rounded-2xl overflow-hidden shadow-warm-lg h-[420px] border border-warm-200">
              <iframe
                src="https://maps.google.com/maps?q=Annada%20Pure%20Veg,%20Anand%20Park,%20Wadgaon%20Sheri,%20Pune&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '420px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Annada Pure Veg Location — Anand Park, Wadgaon Sheri, Pune"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════ */}
      <section className="section bg-espresso text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(200,75,0,0.2)_0%,_transparent_70%)]" />
        <div className="container-custom relative z-10">
          <div className="text-7xl mb-4">🍽️</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Ready for a Pure Veg Morning?
          </h2>
          <p className="text-warm-300 text-lg mb-8 max-w-xl mx-auto">
            Browse our menu, add your favourites to the cart, and we'll deliver it fresh to your door.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/menu"
              className="inline-flex items-center gap-2 px-8 py-4 bg-saffron-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-opacity shadow-warm-xl active:scale-95">
              Order Breakfast Now 🛒
            </Link>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-colors active:scale-95">
              Create Free Account 🌿
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
