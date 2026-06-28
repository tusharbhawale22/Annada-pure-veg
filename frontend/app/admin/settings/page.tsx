'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, MapPin, Phone, Clock, Truck, Trash2, Plus } from 'lucide-react';

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
  foodItems: string;
  isAvailable: boolean;
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

  const { isLoading, isError, error, refetch } = useQuery('settings-admin', () =>
    settingsApi.get().then((r) => r.data.settings), {
    retry: 2,
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
    onError: () => {
      // Initialize form with defaults so the page still renders
      setForm({
        storeName: '',
        tagline: '',
        address: '',
        phone: '',
        whatsappNumber: '',
        email: '',
        deliveryFee: 30,
        minOrderAmount: 100,
        freeDeliveryAbove: 300,
        taxRate: 5,
        googleMapsLink: '',
        deliveryAreas: '',
        tiffinPlans: [],
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

  const handleAddPlan = () => {
    if (!form) return;
    const newPlan: TiffinPlan = {
      id: `tp_${Date.now()}`,
      name: 'New Subscription Plan',
      planType: 'weekly',
      mealType: 'lunch',
      price: 0,
      description: '',
      numberOfDays: 7,
      deliveryTime: '12:30 PM',
      foodItems: 'Dal + Sabzi + Roti + Rice',
      isAvailable: true,
    };
    const currentPlans = Array.isArray(form.tiffinPlans) ? form.tiffinPlans : [];
    setForm({
      ...form,
      tiffinPlans: [...currentPlans, newPlan],
    });
  };

  const handleDeletePlan = (index: number) => {
    if (!form) return;
    const currentPlans = Array.isArray(form.tiffinPlans) ? form.tiffinPlans : [];
    const updated = currentPlans.filter((_, i) => i !== index);
    setForm({
      ...form,
      tiffinPlans: updated,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[1,2,3,4].map((i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}
      </div>
    );
  }

  if (!form) {
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

      {isError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-red-700 font-semibold text-sm">⚠️ Could not load settings from server</p>
            <p className="text-red-500 text-xs mt-0.5">
              {error instanceof Error ? error.message : 'Connection failed. Showing empty defaults.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

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
          <div className="flex justify-between items-center border-b border-warm-100 pb-3">
            <h2 className="font-display font-semibold text-espresso flex items-center gap-2">
              🍱 Tiffin Subscription Plans Settings
            </h2>
            <button 
              type="button" 
              onClick={handleAddPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-leaf text-white text-xs font-bold rounded-lg hover:bg-leaf-hover active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Plan
            </button>
          </div>
          
          <div className="space-y-6 pt-2">
            {(form.tiffinPlans || []).map((plan, index) => (
              <div key={plan.id} className="border border-warm-200 p-4 rounded-xl space-y-3 bg-[#FFFDFB] relative">
                
                {/* Header (Name + Toggle + Delete) */}
                <div className="flex flex-wrap items-center justify-between border-b border-warm-100 pb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      className="font-bold text-espresso text-sm bg-transparent border-b border-transparent hover:border-warm-300 focus:border-[#E65100] focus:outline-none py-0.5 px-1 rounded capitalize" 
                      value={plan.name} 
                      onChange={(e) => {
                        const updated = [...form.tiffinPlans];
                        updated[index] = { ...plan, name: e.target.value };
                        setForm({ ...form, tiffinPlans: updated });
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-3.5 h-3.5 text-[#E65100] border-warm-300 rounded focus:ring-[#E65100]"
                        checked={plan.isAvailable !== false} 
                        onChange={(e) => {
                          const updated = [...form.tiffinPlans];
                          updated[index] = { ...plan, isAvailable: e.target.checked };
                          setForm({ ...form, tiffinPlans: updated });
                        }} 
                      />
                      <span className="text-xs font-semibold text-espresso">Available</span>
                    </label>
                    <button 
                      type="button" 
                      onClick={() => handleDeletePlan(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid of Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="input-label">Plan Type</label>
                    <select 
                      className="input py-2" 
                      value={plan.planType} 
                      onChange={(e) => {
                        const val = e.target.value as 'weekly' | 'monthly';
                        const updated = [...form.tiffinPlans];
                        updated[index] = { 
                          ...plan, 
                          planType: val, 
                          numberOfDays: val === 'weekly' ? 7 : 30 
                        };
                        setForm({ ...form, tiffinPlans: updated });
                      }}
                    >
                      <option value="weekly">Weekly (7 Days)</option>
                      <option value="monthly">Monthly (30 Days)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="input-label">Meal Type</label>
                    <select 
                      className="input py-2" 
                      value={plan.mealType} 
                      onChange={(e) => {
                        const updated = [...form.tiffinPlans];
                        updated[index] = { ...plan, mealType: e.target.value as any };
                        setForm({ ...form, tiffinPlans: updated });
                      }}
                    >
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="both">Both (Lunch & Dinner)</option>
                    </select>
                  </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div>
                    <label className="input-label">Food Items in Tiffin</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. Dal + Sabzi + Roti + Rice"
                      value={plan.foodItems || ''} 
                      onChange={(e) => {
                        const updated = [...form.tiffinPlans];
                        updated[index] = { ...plan, foodItems: e.target.value };
                        setForm({ ...form, tiffinPlans: updated });
                      }} 
                    />
                  </div>
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
