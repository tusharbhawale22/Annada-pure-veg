import type { Metadata } from 'next';
import Link from 'next/link';
import { Leaf, Clock, Truck, ShieldCheck, Star, MapPin, Phone, ChevronRight } from 'lucide-react';
import SpiceParticles from '@/components/SpiceParticles';

export const metadata: Metadata = {
  title: 'Home — Fresh Pure Veg Breakfast & Tiffin in Pune',
};

const features = [
  { icon: '🌿', title: 'Fresh Daily', desc: 'Cooked every morning with no preservatives, no shortcuts. Just fresh, wholesome ingredients.' },
  { icon: '🏠', title: 'Home Delivery', desc: 'Delivered warm to Kharadi, Viman Nagar & Sainath Nagar. Free delivery on orders above ₹300.' },
  { icon: '🍱', title: 'Tiffin Service', desc: 'Subscribe weekly or monthly for daily lunch and/or dinner at your doorstep.' },
  { icon: '💯', title: 'Pure Veg Only', desc: 'We are a 100% vegetarian kitchen — always, without exception.' },
];

const testimonials = [
  {
    name: 'Priya Kulkarni',
    area: 'Viman Nagar',
    rating: 5,
    text: 'Best poha in Pune, hands down! I\'ve been ordering breakfast from Annada for 6 months and it never disappoints. Tastes exactly like mum\'s cooking.',
    avatar: '👩',
  },
  {
    name: 'Rahul Sharma',
    area: 'Kharadi',
    rating: 5,
    text: 'The monthly tiffin plan is a game changer. Hot, healthy, pure veg food every day. My whole family loves it. 100% worth it!',
    avatar: '👨',
  },
  {
    name: 'Meera Joshi',
    area: 'Sainath Nagar',
    rating: 5,
    text: 'Idli-sambhar and medu vada combo is absolutely divine. The sambhar is freshly made — you can tell the difference immediately!',
    avatar: '👩‍🦱',
  },
];

const galleryItems = [
  { emoji: '🍚', name: 'Kanda Poha',    color: 'from-amber-100 to-yellow-200' },
  { emoji: '🫓', name: 'Idli Sambhar',  color: 'from-orange-100 to-amber-200' },
  { emoji: '🧆', name: 'Medu Vada',     color: 'from-yellow-100 to-orange-200' },
  { emoji: '🫔', name: 'Aloo Paratha',  color: 'from-lime-100 to-green-200' },
  { emoji: '☕', name: 'Masala Chai',   color: 'from-amber-200 to-orange-300' },
  { emoji: '🍱', name: 'Tiffin Thali',  color: 'from-rose-100 to-orange-200' },
];

export default function HomePage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-espresso">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-saffron-900 via-[#C84B00] to-espresso" />

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-800/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-saffron-900/30 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />

        {/* Spice particles */}
        <SpiceParticles />

        {/* Content */}
        <div className="container-custom relative z-10 pt-24 pb-16">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-8 animate-fade-in">
              <Leaf className="w-4 h-4 text-green-300" />
              100% Pure Vegetarian · Wadgaon Sheri, Pune
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4 animate-slide-in-up">
              Annada{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-200">
                Pure Veg
              </span>
            </h1>

            {/* Tagline */}
            <p className="font-display text-2xl md:text-3xl text-white/80 italic mb-6 animate-slide-in-up">
              "Ghar Jaisi Subah, Har Subah"
            </p>

            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-xl animate-fade-in">
              Fresh homestyle breakfast cooked every morning and delivered warm to your door.
              No preservatives. No shortcuts. Just pure, honest food.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 animate-slide-in-up">
              <Link href="/menu"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-saffron-900 font-bold text-base rounded-2xl hover:bg-cream transition-all hover:shadow-warm-xl active:scale-95 shadow-warm-lg">
                Order Now 🛒
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link href="/tiffin"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-base rounded-2xl border border-white/30 hover:bg-white/20 transition-all active:scale-95">
                🍱 Tiffin Service
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 mt-10 animate-fade-in">
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-gold-400">500+</p>
                <p className="text-white/60 text-xs">Happy Customers</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-gold-400">4.9 ⭐</p>
                <p className="text-white/60 text-xs">Average Rating</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-gold-400">3+</p>
                <p className="text-white/60 text-xs">Years of Service</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <p className="text-white/50 text-xs font-medium">Scroll to explore</p>
          <div className="w-0.5 h-8 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          WHY CHOOSE US
      ═══════════════════════════════════════════════════ */}
      <section className="section bg-ivory">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title">Why Pune Loves Annada</h2>
            <p className="section-subtitle">The difference you taste in every bite</p>
            <div className="rangoli-divider max-w-xs mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card-hover p-6 text-center group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="font-display font-semibold text-espresso text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-espresso/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          GALLERY
      ═══════════════════════════════════════════════════ */}
      <section className="section bg-cream">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title">What's Cooking Today?</h2>
            <p className="section-subtitle">Freshly prepared, lovingly served</p>
            <div className="rangoli-divider max-w-xs mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {galleryItems.map((item, i) => (
              <Link key={i} href={`/menu?search=${encodeURIComponent(item.name)}`}
                className="group flex flex-col items-center gap-3 cursor-pointer">
                <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-5xl shadow-warm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-warm-lg`}>
                  {item.emoji}
                </div>
                <p className="text-sm font-semibold text-espresso group-hover:text-saffron-900 transition-colors text-center">
                  {item.name}
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/menu" className="btn-primary text-base px-8 py-3.5">
              View Full Menu →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TIFFIN PROMO BANNER
      ═══════════════════════════════════════════════════ */}
      <section className="section bg-gradient-to-r from-saffron-900 to-[#C84B00] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-10 text-8xl">🍱</div>
          <div className="absolute bottom-4 left-10 text-6xl">🥘</div>
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-2xl mx-auto text-center text-white">
            <p className="font-display text-sm font-semibold text-gold-300 uppercase tracking-widest mb-3">
              🍱 Tiffin Service
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ghar ka Khana, Rozana
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              Subscribe to our weekly or monthly tiffin plan and get fresh,
              homestyle lunch and dinner delivered every day.
              Starting at just <strong className="text-gold-300">₹350/week</strong>.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {['Weekly Lunch — ₹350', 'Weekly Dinner — ₹350', 'Monthly Both — ₹2400'].map((p) => (
                <span key={p} className="bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/20">
                  {p}
                </span>
              ))}
            </div>
            <Link href="/tiffin" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-saffron-900 font-bold text-base rounded-2xl hover:bg-cream transition-all active:scale-95 shadow-warm-lg">
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
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Real reviews from our daily regulars</p>
            <div className="rangoli-divider max-w-xs mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card p-6 relative">
                {/* Quote mark */}
                <div className="absolute top-4 right-5 font-display text-6xl text-saffron-900/10 leading-none font-bold">"</div>
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold-800 text-gold-800" />
                  ))}
                </div>
                <p className="text-espresso/80 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-saffron-gradient rounded-full flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-espresso text-sm">{t.name}</p>
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
            <h2 className="section-title">Visit Us or Order Online</h2>
            <p className="section-subtitle">We're open 7 days a week</p>
            <div className="rangoli-divider max-w-xs mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Info card */}
            <div className="card p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-saffron-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-saffron-900" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-espresso mb-1">Our Location</h3>
                  <p className="text-espresso/70 text-sm leading-relaxed">
                    Anand Park Bus Stop, near Sancheti Classes,<br />
                    Wadgaon Sheri, Pune — 411014
                  </p>
                  <a href="https://maps.google.com/?q=Anand+Park+Bus+Stop+Wadgaon+Sheri+Pune"
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
                  <h3 className="font-display font-semibold text-espresso mb-3">Store Hours</h3>
                  <div className="space-y-1.5">
                    {[
                      { days: 'Mon – Sat', time: '7:00 AM – 10:00 PM' },
                      { days: 'Sunday',   time: '7:00 AM – 9:00 PM' },
                    ].map((t) => (
                      <div key={t.days} className="flex justify-between text-sm">
                        <span className="text-espresso/60 font-medium">{t.days}</span>
                        <span className="font-semibold text-espresso">{t.time}</span>
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
                  <h3 className="font-display font-semibold text-espresso mb-1">Call Us</h3>
                  <a href="tel:+919876543210" className="text-saffron-900 font-bold text-lg hover:underline">
                    +91 98765 43210
                  </a>
                </div>
              </div>

              {/* Delivery zones */}
              <div className="bg-saffron-50 rounded-xl p-4 border border-saffron-100">
                <p className="font-semibold text-saffron-900 text-sm mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Delivery Areas
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Kharadi', 'Viman Nagar', 'Sainath Nagar', 'Wadgaon Sheri'].map((area) => (
                    <span key={area} className="text-xs bg-white text-saffron-900 font-semibold px-2.5 py-1 rounded-lg border border-saffron-200">
                      {area}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-saffron-900/70 mt-2">Free delivery on orders above ₹300</p>
              </div>
            </div>

            {/* Google Maps embed */}
            <div className="rounded-2xl overflow-hidden shadow-warm-lg h-[400px] lg:h-full min-h-[300px] border border-warm-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3782.5!2d73.9094!3d18.5534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDMzJzEyLjIiTiA3M8KwNTQnMzMuOCJF!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '300px' }}
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
      <section className="section bg-espresso text-center">
        <div className="container-custom">
          <p className="text-5xl mb-4">🍽️</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Ready for a Pure Veg Morning?
          </h2>
          <p className="text-warm-300 text-lg mb-8 max-w-xl mx-auto">
            Browse our menu, add your favourites to the cart, and we'll deliver it fresh to your door.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/menu" className="inline-flex items-center gap-2 px-8 py-4 bg-saffron-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-opacity shadow-warm-xl active:scale-95">
              Order Breakfast Now 🛒
            </Link>
            <Link href="/tiffin" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-colors active:scale-95">
              Explore Tiffin Plans 🍱
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
