'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { menuApi } from '@/lib/api';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star } from 'lucide-react';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  isTodaySpecial: boolean;
  preparationTime: number;
  sortOrder: number;
}

const CATEGORIES = ['Poha', 'Upma', 'Idli-Sambhar', 'Vada', 'Paratha', 'Chai & Drinks', 'Combos'];

export default function AdminMenuPage() {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [toggling,  setToggling]  = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [editItem,  setEditItem]  = useState<MenuItem | null>(null);
  const [formData,  setFormData]  = useState({ name: '', description: '', price: '', category: 'Poha', preparationTime: '10', sortOrder: '1' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving,    setSaving]    = useState(false);

  const params: Record<string, string> = {};
  if (categoryFilter !== 'All') params.category = categoryFilter;

  const { data, isLoading, refetch } = useQuery(
    ['admin-menu', categoryFilter],
    () => menuApi.getItems(params).then((r) => r.data.items),
    { keepPreviousData: true }
  );

  const handleToggleAvailable = async (id: string) => {
    setToggling(id);
    try {
      await menuApi.toggleAvailable(id);
      refetch();
    } catch { toast.error('Toggle failed'); } finally { setToggling(null); }
  };

  const handleToggleSpecial = async (id: string) => {
    setToggling(id + '-special');
    try {
      await menuApi.toggleSpecial(id);
      refetch();
    } catch { toast.error('Toggle failed'); } finally { setToggling(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await menuApi.deleteItem(id);
      toast.success(`"${name}" deleted`);
      refetch();
    } catch { toast.error('Delete failed'); } finally { setDeleting(null); }
  };

  const openEditForm = (item: MenuItem) => {
    setEditItem(item);
    setFormData({ name: item.name, description: item.description, price: String(item.price), category: item.category, preparationTime: String(item.preparationTime), sortOrder: String(item.sortOrder) });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      fd.append('isVeg', 'true');
      if (imageFile) fd.append('image', imageFile);

      if (editItem) {
        await menuApi.updateItem(editItem._id, fd);
        toast.success('Item updated!');
      } else {
        await menuApi.createItem(fd);
        toast.success('Item added!');
      }
      setShowForm(false); setEditItem(null); setImageFile(null);
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const items: MenuItem[] = data || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-espresso">Menu Items</h1>
        <button onClick={() => { setEditItem(null); setFormData({ name: '', description: '', price: '', category: 'Poha', preparationTime: '10', sortOrder: '1' }); setShowForm(true); }}
          className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['All', ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${categoryFilter === c ? 'bg-saffron-900 text-white' : 'bg-ivory border border-warm-200 text-espresso hover:bg-warm-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-48 skeleton-shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item._id} className={`card p-4 flex flex-col ${!item.isAvailable ? 'opacity-60' : ''}`}>
              {/* Image */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-warm-200 mb-3">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                )}
                {item.isTodaySpecial && (
                  <div className="absolute top-1.5 right-1.5 bg-gold-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">⭐ Special</div>
                )}
              </div>

              <h3 className="font-semibold text-espresso text-sm mb-0.5 truncate">{item.name}</h3>
              <p className="text-xs text-espresso/50 mb-1">{item.category}</p>
              <p className="font-bold text-saffron-900 text-base mb-3">{formatCurrency(item.price)}</p>

              {/* Action buttons */}
              <div className="mt-auto grid grid-cols-2 gap-1.5">
                <button onClick={() => handleToggleAvailable(item._id)} disabled={toggling === item._id}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${item.isAvailable ? 'bg-leaf/10 text-leaf hover:bg-leaf/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                  {item.isAvailable ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {item.isAvailable ? 'Available' : 'Sold Out'}
                </button>
                <button onClick={() => handleToggleSpecial(item._id)} disabled={toggling === item._id + '-special'}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${item.isTodaySpecial ? 'bg-gold-50 text-gold-700 hover:bg-gold-100' : 'bg-warm-200 text-espresso/60 hover:bg-warm-300'}`}>
                  <Star className="w-3.5 h-3.5" /> Special
                </button>
                <button onClick={() => openEditForm(item)} className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-warm-200 text-espresso hover:bg-warm-300 transition-all">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(item._id, item.name)} disabled={deleting === item._id}
                  className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-all">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-espresso/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cream rounded-2xl shadow-warm-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="font-display font-bold text-xl text-espresso mb-5">
                {editItem ? 'Edit Item' : 'Add Menu Item'}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="input-label">Name *</label>
                  <input required className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Description</label>
                  <textarea className="input resize-none" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Price (₹) *</label>
                    <input required type="number" min="1" className="input" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                  <div>
                    <label className="input-label">Category *</label>
                    <select required className="input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Prep Time (min)</label>
                    <input type="number" min="1" className="input" value={formData.preparationTime} onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="input-label">Sort Order</label>
                    <input type="number" min="1" className="input" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="input-label">Image</label>
                  <input type="file" accept="image/*" className="input py-2" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                    {saving ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
