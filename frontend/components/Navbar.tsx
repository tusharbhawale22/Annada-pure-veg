'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, User, LogOut, ChevronDown, Leaf, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const totalItems = useCartStore((s) => s.getTotalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const clearCart  = useCartStore((s) => s.clearCart);
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
      clearCart(); // ← Clear cart on logout so next user doesn't see previous cart
      clearUser();
      setUserMenuOpen(false);
      toast.success('Logged out. See you tomorrow! 🌿');
      router.push('/');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/menu?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  // Don't show navbar on admin or auth pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth')) return null;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || pathname !== '/'
          ? 'bg-[#C84B00]/95 backdrop-blur-md shadow-warm border-b border-white/10'
          : 'bg-transparent',
      )}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16 md:h-20">

          {/* ── Logo ───────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-saffron-gradient rounded-xl flex items-center justify-center shadow-warm-sm group-hover:shadow-warm transition-shadow">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none text-white">
              <p className="font-display font-bold text-lg group-hover:text-gold-300 transition-colors">
                Annada
              </p>
              <p className="text-xs font-semibold tracking-wide text-white/80">PURE VEG</p>
            </div>
          </Link>

          {/* ── Desktop Nav Links ───────────────────────────── */}
          <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300",
                    isActive ? "bg-white text-[#C84B00] shadow-sm" : "text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── Right Actions ────────────────────────────────── */}
          <div className="flex items-center gap-3">
            
            {/* Search Bar */}
            {pathname !== '/' && pathname !== '/tiffin' && pathname !== '/checkout' && !pathname?.startsWith('/profile') && (
              <form onSubmit={handleSearch} className="hidden lg:flex items-center relative">
                <input 
                  type="text" 
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all w-48"
                />
                <Search className="w-4 h-4 text-white/70 absolute left-3" />
              </form>
            )}
            <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1 gap-1">
              {/* Cart Button — only show when authenticated */}
              {isAuthenticated && (
                <button
                  onClick={toggleCart}
                  className={cn(
                    'relative flex items-center justify-center py-2 px-3 text-white hover:bg-white/10 rounded-full transition-colors',
                    cartBounce && 'animate-bounce-cart'
                  )}
                  aria-label="Open cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#C84B00] text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </button>
              )}

              {/* User Menu */}
              {isAuthenticated && user ? (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 py-1.5 px-3 pl-2 text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold max-w-[100px] truncate">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-white/70">Profile</span>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 transition-transform text-white/70', userMenuOpen && 'rotate-180')} />
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
              /* Login + Register buttons for unauthenticated users */
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login"
                  className="py-2 px-5 text-sm text-white hover:bg-white/10 rounded-full transition-colors font-semibold">
                  Login
                </Link>
                <Link href="/auth/register"
                  className="bg-white text-[#C84B00] py-2 px-5 text-sm rounded-full font-semibold hover:opacity-90 transition-opacity">
                  Register
                </Link>
              </div>
            )}
            </div>

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
                className="btn-primary justify-center py-3">
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
              <div className="flex flex-col gap-2">
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="btn-primary justify-center py-3">Login</Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="btn-primary justify-center py-3">Register Free 🌿</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
