'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, Users,
  BarChart3, Settings, BoxSelect, LogOut, Leaf, ExternalLink
} from 'lucide-react';

const navItems = [
  { href: '/admin',            label: 'Dashboard',  icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/admin/orders',     label: 'Orders',     icon: <ShoppingBag className="w-5 h-5" /> },
  { href: '/admin/menu',       label: 'Menu Items', icon: <UtensilsCrossed className="w-5 h-5" /> },
  { href: '/admin/tiffin',     label: 'Tiffin',     icon: <BoxSelect className="w-5 h-5" /> },
  { href: '/admin/analytics',  label: 'Analytics',  icon: <BarChart3 className="w-5 h-5" /> },
  { href: '/admin/customers',  label: 'Customers',  icon: <Users className="w-5 h-5" /> },
  { href: '/admin/settings',   label: 'Settings',   icon: <Settings className="w-5 h-5" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isAuthenticated, clearUser } = useAuthStore();

  // Redirect non-admins
  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login?redirect=/admin'); return; }
    if (user?.role !== 'admin') { router.push('/'); toast.error('Admin access required.'); }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'admin') return null;

  const handleLogout = async () => {
    try { await authApi.logout(); } finally {
      clearUser();
      toast.success('Logged out.');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-espresso flex flex-col z-40">
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
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-saffron-gradient text-white shadow-warm-sm'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}>
                {item.icon}
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

      {/* ── Main content ────────────────────────────────── */}
      <main className="flex-1 ml-64 min-h-screen bg-cream">
        {children}
      </main>
    </div>
  );
}
