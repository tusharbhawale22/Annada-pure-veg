'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, Users,
  BarChart3, Settings, BoxSelect, LogOut, Leaf, ExternalLink,
  Menu, X,
} from 'lucide-react';

const navItems = [
  { href: '/admin',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/orders',    label: 'Orders',     icon: ShoppingBag },
  { href: '/admin/menu',      label: 'Menu',       icon: UtensilsCrossed },
  { href: '/admin/tiffin',    label: 'Tiffin',     icon: BoxSelect },
  { href: '/admin/analytics', label: 'Analytics',  icon: BarChart3 },
  { href: '/admin/customers', label: 'Customers',  icon: Users },
  { href: '/admin/settings',  label: 'Settings',   icon: Settings },
];

// Bottom tab bar shows first 5 items for mobile
const bottomTabs = navItems.slice(0, 5);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isAuthenticated, clearUser } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // hasHydrated prevents redirect before Zustand reads from localStorage
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Mark hydration complete after first render (localStorage has been read)
    setHasHydrated(true);
  }, []);

  // Redirect non-admins — only after store has hydrated from localStorage
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/auth/login?redirect=/admin'); return; }
    if (user?.role !== 'admin') { router.push('/'); toast.error('Admin access required.'); }
  }, [hasHydrated, isAuthenticated, user, router]);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Show a loading spinner while hydrating to avoid flash
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-saffron-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') return null;

  const handleLogout = async () => {
    try { await authApi.logout(); } finally {
      clearUser();
      toast.success('Logged out.');
      window.location.href = '/';
    }
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href);

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Desktop Sidebar (hidden on mobile) ──────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-espresso flex-col z-40">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-saffron-gradient rounded-xl flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">Annada Admin</p>
              <p className="text-[10px] text-gold-400 font-semibold tracking-widest">PURE VEG</p>
            </div>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive(item.href)
                    ? 'bg-saffron-gradient text-white shadow-warm-sm'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}>
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link href="/" target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all">
            <ExternalLink className="w-5 h-5" />
            View Store
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
          <div className="px-3 pt-2">
            <p className="text-white/40 text-xs">Logged in as</p>
            <p className="text-white text-xs font-semibold truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Header ───────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-espresso flex items-center justify-between px-4 h-14 shadow-lg">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-saffron-gradient rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-sm">Annada Admin</span>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Mobile Drawer Overlay ───────────────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile Slide-in Drawer ──────────────────────────── */}
      <div className={cn(
        'md:hidden fixed top-0 right-0 h-full w-72 bg-espresso z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl',
        drawerOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="font-display font-bold text-white">Menu</p>
            <p className="text-white/50 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  isActive(item.href)
                    ? 'bg-saffron-gradient text-white shadow-warm-sm'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}>
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Drawer bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link href="/" target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all">
            <ExternalLink className="w-5 h-5" />
            View Store
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className={cn(
        'min-h-screen bg-cream',
        'md:ml-64',             // desktop: offset for sidebar
        'pt-14 md:pt-0',        // mobile: offset for top header
      )}>
        {children}
      </main>
    </div>
  );
}
