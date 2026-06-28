'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, MapPin, Phone, Clock, Truck } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TiffinPlan {
  id: string;
  name: string;
  planType: 'weekly' | 'monthly';
  mealType: 'lunch' | 'dinner' | 'both';
  price: number;
  description: string;
  numberOfDays: number;
  deliveryTime: string;
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    storeName: string;
    tagline: string;
    address: string;
    phone: string;
    whatsappNumber: string;
    email: string;
    deliveryFee: number;
    minOrderAmount: number;
    freeDeliveryAbove: number;
    taxRate: number;
    googleMapsLink: string;
    deliveryAreas: string;
    tiffinPlans: TiffinPlan[];
  } | null>(null);

  const { isLoading } = useQuery('settings-admin', () =>
    settingsApi.get().then((r) => r.data.settings), {
    onSuccess: (settings) => {
      setForm({
        storeName: settings.storeName || '',
        tagline: settings.tagline || '',
        address: settings.address || '',
        phone: settings.phone || '',
        whatsappNumber: settings.whatsappNumber || '',
        email: settings.email || '',
        deliveryFee: settings.deliveryFee || 30,
        minOrderAmount: settings.minOrderAmount || 100,
        freeDeliveryAbove: settings.freeDeliveryAbove || 300,
        taxRate: settings.taxRate || 5,
        googleMapsLink: settings.googleMapsLink || '',
        deliveryAreas: (settings.deliveryAreas || []).join(', '),
        tiffinPlans: settings.tiffinPlans || [],
      });
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await settingsApi.update({
        ...form,
        deliveryAreas: form.deliveryAreas.split(',').map((s) => s.trim()).filter(Boolean),
      });
      toast.success('Settings saved! ✅');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  };

  if (isLoading || !form) {
    return (
      <div className="p-8 space-y-4">
        {[1,2,3,4].map((i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}
      </div>
    );
  }

  const setField = (key: keyof typeof form, value: string | number) =>
    setForm((f) => f ? { ...f, [key]: value } : f);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-espresso mb-6">Store Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-espresso flex items-center gap-2">
            🏪 Store Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Store Name</label>
              <input className="input" value={form.storeName} onChange={(e) => setField('storeName', e.target.value)} />
            </div>
            <div>
              <label className="input-label">Tagline</label>
              <input className="input" value={form.tagline} onChange={(e) => setField('tagline', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="input-label flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Address</label>
            <textarea className="input resize-none" rows={2} value={form.address} onChange={(e) => setField('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
            </div>
            <div>
              <label className="input-label">WhatsApp Number</label>
              <input className="input" placeholder="91XXXXXXXXXX" value={form.whatsappNumber} onChange={(e) => setField('whatsappNumber', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="input-label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </div>
          <div>
            <label className="input-label">Google Maps Link</label>
            <input className="input" value={form.googleMapsLink} onChange={(e) => setField('googleMapsLink', e.target.value)} />
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-espresso flex items-center gap-2">
            <Truck className="w-5 h-5 text-saffron-900" /> Delivery Settings
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Delivery Fee (₹)</label>
              <input type="number" min="0" className="input" value={form.deliveryFee} onChange={(e) => setField('deliveryFee', Number(e.target.value))} />
            </div>
            <div>
              <label className="input-label">Min Order (₹)</label>
              <input type="number" min="0" className="input" value={form.minOrderAmount} onChange={(e) => setField('minOrderAmount', Number(e.target.value))} />
            </div>
            <div>
              <label className="input-label">Free Delivery Above (₹)</label>
              <input type="number" min="0" className="input" value={form.freeDeliveryAbove} onChange={(e) => setField('freeDeliveryAbove', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="input-label">Tax Rate (%)</label>
            <input type="number" min="0" max="100" step="0.5" className="input max-w-[120px]" value={form.taxRate} onChange={(e) => setField('taxRate', Number(e.target.value))} />
          </div>
          <div>
            <label className="input-label">Delivery Areas (comma separated)</label>
            <input className="input" placeholder="Kharadi, Viman Nagar, Sainath Nagar" value={form.deliveryAreas} onChange={(e) => setField('deliveryAreas', e.target.value)} />
          </div>
        </div>

        {/* Tiffin Plans Settings */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-espresso flex items-center gap-2">
            🍱 Tiffin Subscription Plans Settings
          </h2>
          <div className="space-y-6">
            {(form.tiffinPlans || []).map((plan, index) => (
              <div key={plan.id} className="border border-warm-200 p-4 rounded-xl space-y-3 bg-[#FFFDFB]">
                <div className="flex items-center justify-between border-b border-warm-100 pb-2">
                  <span className="font-bold text-espresso text-sm capitalize">{plan.name} Plan</span>
                  <span className="text-xs bg-saffron-100 text-saffron-900 px-2 py-0.5 rounded font-medium uppercase">{plan.planType}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="input-label">Price (₹)</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="input" 
                      value={plan.price} 
                      onChange={(e) => {
                        const updated = [...form.tiffinPlans];
                        updated[index] = { ...plan, price: Number(e.target.value) };
                        setForm({ ...form, tiffinPlans: updated });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="input-label">Number of Days</label>
                    <input 
                      type="number" 
                      min="1" 
                      className="input" 
                      value={plan.numberOfDays || 0} 
                      onChange={(e) => {
                        const updated = [...form.tiffinPlans];
                        updated[index] = { ...plan, numberOfDays: Number(e.target.value) };
                        setForm({ ...form, tiffinPlans: updated });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="input-label">Delivery Time</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={plan.deliveryTime || ''} 
                      onChange={(e) => {
                        const updated = [...form.tiffinPlans];
                        updated[index] = { ...plan, deliveryTime: e.target.value };
                        setForm({ ...form, tiffinPlans: updated });
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">Description</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={plan.description || ''} 
                    onChange={(e) => {
                      const updated = [...form.tiffinPlans];
                      updated[index] = { ...plan, description: e.target.value };
                      setForm({ ...form, tiffinPlans: updated });
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary gap-2 px-8">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
