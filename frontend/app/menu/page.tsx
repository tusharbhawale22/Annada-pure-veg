'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Search, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import { menuApi } from '@/lib/api';
import MenuCard from '@/components/MenuCard';
import { SkeletonList } from '@/components/SkeletonCard';
import { debounce, cn, formatCurrency } from '@/lib/utils';
import MenuSidebar from '@/components/MenuSidebar';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Morning Booster', 'Healthy Tummy', 'Yummy Bites', 'Wrap', 'Pizza', 'Maggi'];

const CATEGORY_EMOJIS: Record<string, string> = {
  All: '🍽️', 'Morning Booster': '🌅', 'Healthy Tummy': '🥗', 'Yummy Bites': '🥪', Wrap: '🌯',
  Pizza: '🍕', Maggi: '🍜',
};

export default function MenuPage() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [layout,   setLayout]   = useState<'grid' | 'list'>('grid');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { addItem } = useCartStore();

  const handleAddSpecial = (item: any) => {
    if (!item.isAvailable) return;
    addItem({
      _id: item._id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category,
    });
    toast.success(`${item.name} added to cart! 🛒`, { duration: 1500 });
  };

  const debouncedSetSearch = useMemo(
    () => debounce((v: unknown) => setDebouncedSearch(v as string), 400),
    []
  );

  const handleSearchChange = (v: string) => {
    setSearch(v);
    debouncedSetSearch(v);
  };

  const params: Record<string, string> = {};
  if (category !== 'All') params.category = category;
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading, isError } = useQuery(
    ['menu', category, debouncedSearch],
    () => menuApi.getItems(params).then((r) => r.data),
    { keepPreviousData: true }
  );

  const { data: specialsData } = useQuery(
    'specials',
    () => menuApi.getSpecials().then((r) => r.data),
    { enabled: category === 'All' && !debouncedSearch }
  );

  const items = data?.items ?? [];
  const specials = specialsData?.items ?? [];
  const nonSpecials = items.filter((i: { isTodaySpecial: boolean }) => !i.isTodaySpecial);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] min-h-screen bg-[#FFFDFB] pt-16 md:pt-20">
      
      {/* ── Left Area: Main Content ── */}
      <div className="flex flex-col pb-20 lg:pb-0">

        {/* ── Header Banner ── */}
        <div className="bg-gradient-to-b from-[#3D1000] to-[#6B2200] py-14 px-4 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="max-w-2xl mx-auto text-center text-white relative z-10">
            <p className="text-[#FFD700] font-bold text-xs uppercase tracking-[0.3em] mb-3">PURE VEGETARIAN</p>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-3">
              <span className="text-4xl">🍽️</span> Our Menu
            </h1>
            <p className="text-white/75 text-base md:text-lg leading-relaxed">
              Fresh, homestyle cooking — made every morning with love and care.
            </p>
          </div>
        </div>

        {/* ── Category Pills (below banner) ── */}
        <div className="bg-[#FFFDFB] px-4 md:px-8 pt-5 pb-2 border-b border-warm-100 shadow-sm">
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const isActive = category === cat;
              return (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 border",
                    isActive
                      ? "bg-[#E65100] text-white border-[#E65100] shadow-md"
                      : "bg-white text-espresso border-warm-200 hover:border-[#E65100]/40 hover:text-[#E65100]"
                  )}>
                  <span className="text-base leading-none">{CATEGORY_EMOJIS[cat]}</span>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 md:px-8 pt-6">
        {/* ── Search (Mobile Only) ── */}
        <div className="lg:hidden relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso/40" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-white border border-warm-200 text-espresso rounded-full py-3 pl-11 pr-10 text-sm shadow-sm"
          />
          {search && (
            <button onClick={() => { setSearch(''); setDebouncedSearch(''); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>


        {isLoading && <SkeletonList count={8} />}

        {isError && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">😕</p>
            <p className="font-display font-bold text-xl text-espresso mb-2">Could not load menu</p>
            <p className="text-espresso/60 text-sm">Please check your connection and try again.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* All items */}
            {items.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🔍</p>
                <p className="font-display font-bold text-xl text-espresso mb-2">Nothing found</p>
                <p className="text-espresso/60 text-sm">Try a different search term or category.</p>
              </div>
            ) : (
              <>
                {(category !== 'All' || debouncedSearch) && (
                  <p className="text-sm text-espresso/60 mb-4 font-medium px-2">
                    Showing {items.length} item{items.length !== 1 ? 's' : ''}
                    {category !== 'All' ? ` in "${category}"` : ''}
                  </p>
                )}
                
                {/* Menu Layout */}
                {category === 'All' && !debouncedSearch ? (
                  <div className="flex flex-col gap-12 pb-10">
                    {/* Today's Specials (Mobile Only) */}
                    {specials.length > 0 && (
                      <div className="lg:hidden bg-gradient-to-br from-[#E65100] to-[#C84B00] text-white rounded-3xl p-5 shadow-warm-lg mb-2 relative overflow-hidden">
                        {/* Decorative subtle background pattern */}
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        
                        <div className="relative z-10">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD700] text-[#3D1000] text-xs font-bold rounded-full mb-4 shadow-sm">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Our Special Dishes! 🌟
                          </div>
                          
                          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                            {specials.map((item: any) => (
                              <div 
                                key={item._id} 
                                onClick={() => handleAddSpecial(item)}
                                className="relative flex-shrink-0 w-40 snap-start group rounded-2xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-4 flex flex-col items-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                              >
                                {/* Decorative corners */}
                                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/30 rounded-tl-sm" />
                                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/30 rounded-tr-sm" />
                                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white/30 rounded-bl-sm" />
                                <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/30 rounded-br-sm" />
                                
                                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border-2 border-white/20 mb-2.5 bg-white/10">
                                  {item.imageUrl ? (
                                    <Image src={item.imageUrl} alt={item.name} width={80} height={80} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                                  )}
                                </div>
                                
                                <h4 className="font-display font-semibold text-xs text-center mb-1 line-clamp-1 w-full">{item.name}</h4>
                                <p className="text-[#FFD700] font-bold text-xs">{formatCurrency(item.price)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {CATEGORIES.filter(c => c !== 'All').map(cat => {
                      const catItems = items.filter((i: any) => i.category === cat);
                      if (catItems.length === 0) return null;
                      
                      return (
                        <div key={cat} className="flex flex-col">
                          <h2 className="text-2xl font-display font-bold text-espresso mb-6 flex items-center gap-2 px-2 border-b-2 border-warm-100 pb-2">
                            <span>{CATEGORY_EMOJIS[cat]}</span> {cat}
                          </h2>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-1">
                            {catItems.map((item: any) => (
                              <MenuCard key={item._id} item={item} layout="grid" />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 px-2">
                    {items.map((item: Parameters<typeof MenuCard>[0]['item']) => (
                      <MenuCard key={item._id} item={item} layout="grid" />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
        </div>
      </div>

      {/* ── Right Area: Sidebar (Desktop Only) ── */}
      <MenuSidebar specials={specials} />
    </div>
  );
}
