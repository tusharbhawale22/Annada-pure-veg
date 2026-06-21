'use client';

import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Package, UtensilsCrossed, LogOut, ChevronRight,
  MapPin, Plus, Trash2, X, Check, Home,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

type NewAddrForm = {
  label: string;
  line1: string;
  area: string;
  pincode: string;
  landmark: string;
};

const blankForm: NewAddrForm = { label: 'Home', line1: '', area: '', pincode: '', landmark: '' };

export default function ProfilePage() {
  const { user, isAuthenticated, clearUser, updateUser } = useAuthStore();
  const router = useRouter();

  // Profile edit state
  const [editing, setEditing]  = useState(false);
  const [saving,  setSaving]   = useState(false);
  const [form,    setForm]     = useState({ name: user?.name || '', phone: user?.phone || '' });

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  // Address state
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrForm,    setAddrForm]    = useState<NewAddrForm>(blankForm);
  const [addrSaving,  setAddrSaving]  = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error('All password fields are required.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords don't match.");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    setPwSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully! 🔑');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Password change failed.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.line1 || !addrForm.area || !addrForm.pincode) {
      toast.error('Please fill in Address, Area and Pincode');
      return;
    }
    if (!/^\d{6}$/.test(addrForm.pincode)) {
      toast.error('Pincode must be 6 digits');
      return;
    }
    setAddrSaving(true);
    try {
      const res = await authApi.addAddress(addrForm);
      updateUser({ addresses: res.data.addresses });
      toast.success('Address saved! 🏡');
      setAddrForm(blankForm);
      setShowAddAddr(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not save address');
    } finally { setAddrSaving(false); }
  };

  const handleDeleteAddress = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await authApi.deleteAddress(id);
      updateUser({ addresses: res.data.addresses });
      toast.success('Address removed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not remove address');
    } finally { setDeletingId(null); }
  };

  const quickLinks = [
    { href: '/profile/orders', icon: <Package className="w-5 h-5" />, label: 'My Orders', desc: 'View order history & track' },
    { href: '/profile/tiffin', icon: <UtensilsCrossed className="w-5 h-5" />, label: 'My Tiffin', desc: 'Manage tiffin subscriptions' },
  ];

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="container-custom py-8 max-w-xl mx-auto">

        {/* ── Profile header ── */}
        <div className="card p-6 mb-5 text-center">
          <div className="w-20 h-20 bg-saffron-gradient rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="font-display font-bold text-2xl text-espresso">{user.name}</h1>
          <p className="text-espresso/60 text-sm mt-0.5">{user.email}</p>
          <p className="text-espresso/50 text-xs mt-0.5">Member since {formatDate(user.createdAt)}</p>
          {user.role === 'admin' && (
            <span className="inline-block mt-2 bg-saffron-900 text-white text-xs font-bold px-3 py-1 rounded-full">Admin</span>
          )}
        </div>

        {/* ── Account Details / Change Password ── */}
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
        ) : changingPassword ? (
          <div className="card p-6 mb-5">
            <h2 className="font-display font-semibold text-espresso mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="input-label">Current Password</label>
                <input required type="password" className="input text-sm" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
              </div>
              <div>
                <label className="input-label">New Password</label>
                <input required type="password" className="input text-sm" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Confirm New Password</label>
                <input required type="password" className="input text-sm" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={pwSaving} className="btn-primary flex-1 justify-center text-sm py-2.5">
                  {pwSaving ? 'Updating...' : 'Update Password'}
                </button>
                <button type="button" onClick={() => setChangingPassword(false)} className="btn-ghost flex-1 justify-center text-sm py-2.5">Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card p-5 mb-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-espresso flex items-center gap-2"><User className="w-4 h-4" /> Account Details</h2>
              <div className="flex gap-3">
                <button onClick={() => { setEditing(true); setChangingPassword(false); }} className="text-sm text-saffron-900 font-semibold hover:underline">Edit</button>
                <button onClick={() => { setChangingPassword(true); setEditing(false); }} className="text-sm text-saffron-900 font-semibold hover:underline">Change Password</button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-espresso/60">Name</span><span className="font-medium">{user.name}</span></div>
              <div className="flex justify-between"><span className="text-espresso/60">Email</span><span className="font-medium">{user.email}</span></div>
              <div className="flex justify-between"><span className="text-espresso/60">Phone</span><span className="font-medium">{user.phone || '—'}</span></div>
            </div>
          </div>
        )}

        {/* ── Delivery Addresses ── */}
        <div className="card p-5 mb-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-espresso flex items-center gap-2">
              <MapPin className="w-4 h-4 text-saffron-900" /> Delivery Addresses
            </h2>
            {!showAddAddr && (user.addresses?.length || 0) < 5 && (
              <button
                onClick={() => setShowAddAddr(true)}
                className="flex items-center gap-1 text-sm text-saffron-900 font-semibold hover:underline"
              >
                <Plus className="w-4 h-4" /> Add New
              </button>
            )}
          </div>

          {/* Saved address list */}
          {(user.addresses?.length || 0) === 0 && !showAddAddr ? (
            <div className="text-center py-6 bg-warm-100 rounded-xl border border-dashed border-warm-300">
              <p className="text-4xl mb-2">🏡</p>
              <p className="text-sm font-semibold text-espresso">No saved addresses yet</p>
              <p className="text-xs text-espresso/50 mb-3">Save your delivery address for quick checkout</p>
              <button onClick={() => setShowAddAddr(true)} className="btn-primary text-sm py-2 px-5">
                <Plus className="w-4 h-4" /> Add Address
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {user.addresses?.map((addr) => (
                <div key={addr._id}
                  className="flex items-start gap-3 p-4 bg-saffron-50 border border-saffron-100 rounded-xl group">
                  <div className="w-9 h-9 bg-white border border-saffron-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-saffron-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-espresso">{addr.label}</p>
                    <p className="text-xs text-espresso/70 mt-0.5">{addr.line1}</p>
                    <p className="text-xs text-espresso/50">
                      {addr.area} — {addr.pincode}
                      {addr.landmark ? ` · near ${addr.landmark}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr._id)}
                    disabled={deletingId === addr._id}
                    title="Remove address"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === addr._id
                      ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new address form */}
          {showAddAddr && (
            <form onSubmit={handleAddAddress} className="mt-4 space-y-3 border-t border-warm-200 pt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-espresso">New Address</p>
                <button type="button" onClick={() => { setShowAddAddr(false); setAddrForm(blankForm); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-warm-200 text-espresso/50">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label text-xs">Label</label>
                  <select className="input text-sm" value={addrForm.label}
                    onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}>
                    {['Home', 'Work', 'Other'].map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label text-xs">Area *</label>
                  <input className="input text-sm" placeholder="e.g. Kharadi" value={addrForm.area}
                    onChange={(e) => setAddrForm({ ...addrForm, area: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="input-label text-xs">Flat / House No. &amp; Building *</label>
                <input className="input text-sm" placeholder="e.g. Flat 402, Lotus Heights" value={addrForm.line1}
                  onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label text-xs">Pincode *</label>
                  <input className="input text-sm" placeholder="411014" maxLength={6} value={addrForm.pincode}
                    onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} />
                </div>
                <div>
                  <label className="input-label text-xs">Landmark</label>
                  <input className="input text-sm" placeholder="Near blue gate" value={addrForm.landmark}
                    onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={addrSaving} className="btn-primary flex-1 justify-center py-2.5 text-sm">
                  {addrSaving
                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</span>
                    : <><Check className="w-4 h-4" /> Save Address</>
                  }
                </button>
                <button type="button" onClick={() => { setShowAddAddr(false); setAddrForm(blankForm); }}
                  className="btn-ghost flex-1 justify-center py-2.5 text-sm">Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* ── Quick links ── */}
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

        {/* ── Logout ── */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}
