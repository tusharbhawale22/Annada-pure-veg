'use client';

import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Package, UtensilsCrossed, LogOut, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, isAuthenticated, clearUser, updateUser } = useAuthStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-cream pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-3">🔒</p>
          <p className="font-display font-bold text-xl mb-3">Please login to view your profile</p>
          <Link href="/auth/login?redirect=/profile" className="btn-primary">Login</Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try { await authApi.logout(); } finally {
      clearUser();
      toast.success('Logged out 🌿');
      router.push('/');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally { setSaving(false); }
  };

  const quickLinks = [
    { href: '/profile/orders', icon: <Package className="w-5 h-5" />, label: 'My Orders', desc: 'View order history & track' },
    { href: '/profile/tiffin', icon: <UtensilsCrossed className="w-5 h-5" />, label: 'My Tiffin', desc: 'Manage tiffin subscriptions' },
  ];

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="container-custom py-8 max-w-xl mx-auto">

        {/* Profile header */}
        <div className="card p-6 mb-5 text-center">
          <div className="w-20 h-20 bg-saffron-gradient rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="font-display font-bold text-2xl text-espresso">{user.name}</h1>
          <p className="text-espresso/60 text-sm mt-0.5">{user.email}</p>
          <p className="text-espresso/50 text-xs mt-0.5">Member since {formatDate(user.createdAt)}</p>
          {user.role === 'admin' && (
            <span className="inline-block mt-2 bg-saffron-900 text-white text-xs font-bold px-3 py-1 rounded-full">
              Admin
            </span>
          )}
        </div>

        {/* Edit profile form */}
        {editing ? (
          <div className="card p-6 mb-5">
            <h2 className="font-display font-semibold text-espresso mb-4">Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="input-label">Full Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={10} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card p-5 mb-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-espresso flex items-center gap-2"><User className="w-4 h-4" /> Account Details</h2>
              <button onClick={() => setEditing(true)} className="text-sm text-saffron-900 font-semibold hover:underline">Edit</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-espresso/60">Name</span><span className="font-medium">{user.name}</span></div>
              <div className="flex justify-between"><span className="text-espresso/60">Email</span><span className="font-medium">{user.email}</span></div>
              <div className="flex justify-between"><span className="text-espresso/60">Phone</span><span className="font-medium">{user.phone || '—'}</span></div>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="space-y-3 mb-5">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="card-hover p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-saffron-50 rounded-xl flex items-center justify-center text-saffron-900">{link.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-espresso text-sm">{link.label}</p>
                <p className="text-xs text-espresso/50">{link.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-espresso/30" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}
