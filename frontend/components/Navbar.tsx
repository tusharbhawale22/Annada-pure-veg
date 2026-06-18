'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, User, LogOut, ChevronDown, Leaf } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/',       label: 'Home'    },
  { href: '/menu',   label: 'Menu'    },
  { href: '/tiffin', label: 'Tiffin 🍱' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartBounce,  setCartBounce]  = useState(false);

  const totalItems = useCartStore((s) => s.getTotalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const { user, isAuthenticated, clearUser } = useAuthStore();

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cart bounce animation when items change
  useEffect(() => {
    if (totalItems > 0) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    }
  }, [totalItems]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearUser();
      setUserMenuOpen(false);
      toast.success('Logged out. See you tomorrow! 🌿');
      router.push('/');
    }
  };

  // Don't show navbar on admin pages
  if (pathname?.startsWith('/admin')) return null;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-cream/95 backdrop-blur-md shadow-warm border-b border-warm-200'
          : 'bg-transparent'
      )}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16 md:h-20">

          {/* ── Logo ───────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-saffron-gradient rounded-xl flex items-center justify-center shadow-warm-sm group-hover:shadow-warm transition-shadow">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <p className="font-display font-bold text-lg text-espresso group-hover:text-saffron-900 transition-colors">
                Annada
              </p>
              <p className="text-xs text-saffron-900 font-semibold tracking-wide">PURE VEG</p>
            </div>
          </Link>

          {/* ── Desktop Nav Links ───────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  pathname === link.href
                    ? 'bg-saffron-900 text-white shadow-warm-sm'
                    : 'text-espresso hover:bg-warm-200 hover:text-saffron-900'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right Actions ────────────────────────────────── */}
          <div className="flex items-center gap-2">
            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className={cn(
                'relative flex items-center justify-center w-10 h-10 rounded-xl',
                'text-espresso hover:bg-warm-200 transition-all duration-200',
                cartBounce && 'animate-bounce-cart'
              )}
              aria-label="Open cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-saffron-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-warm-200 transition-all"
                >
                  <div className="w-7 h-7 bg-saffron-gradient rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-espresso max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', userMenuOpen && 'rotate-180')} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-warm-lg border border-warm-200 py-2 animate-slide-in-up">
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-espresso hover:bg-warm-100 transition-colors">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link href="/profile/orders" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-espresso hover:bg-warm-100 transition-colors">
                      📦 My Orders
                    </Link>
                    <Link href="/profile/tiffin" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-espresso hover:bg-warm-100 transition-colors">
                      🍱 My Tiffin
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-saffron-900 hover:bg-saffron-50 transition-colors">
                        ⚙️ Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-warm-200" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="hidden md:block btn-primary py-2 px-5 text-sm">
                Login
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-warm-200 transition-all"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* ── Mobile Menu ───────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden bg-cream border-t border-warm-200 shadow-warm-lg animate-slide-in-up">
          <div className="container-custom py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                  pathname === link.href
                    ? 'bg-saffron-900 text-white'
                    : 'text-espresso hover:bg-warm-200'
                )}>
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-warm-200" />
            {isAuthenticated ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-semibold text-espresso hover:bg-warm-200">👤 My Profile</Link>
                <Link href="/profile/orders" onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-semibold text-espresso hover:bg-warm-200">📦 My Orders</Link>
                <Link href="/profile/tiffin" onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-semibold text-espresso hover:bg-warm-200">🍱 My Tiffin</Link>
                <button onClick={handleLogout} className="text-left px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50">🚪 Logout</button>
              </>
            ) : (
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="btn-primary justify-center">Login / Register</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
