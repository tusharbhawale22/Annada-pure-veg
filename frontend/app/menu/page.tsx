'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Search, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import { menuApi } from '@/lib/api';
import MenuCard from '@/components/MenuCard';
import { SkeletonList } from '@/components/SkeletonCard';
import { debounce } from '@/lib/utils';

const CATEGORIES = ['All', 'Poha', 'Upma', 'Idli-Sambhar', 'Vada', 'Paratha', 'Chai & Drinks', 'Combos'];

const CATEGORY_EMOJIS: Record<string, string> = {
  All: '🍽️', Poha: '🍚', Upma: '🫕', 'Idli-Sambhar': '🫓', Vada: '🧆',
  Paratha: '🫔', 'Chai & Drinks': '☕', Combos: '🎁',
};

export default function MenuPage() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [layout,   setLayout]   = useState<'grid' | 'list'>('grid');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
    <div className="min-h-screen bg-cream pt-20">
      {/* ── Page Header ───────────────────────────────── */}
      <div className="bg-gradient-to-br from-saffron-900 to-[#C84B00] py-14 px-4">
        <div className="container-custom text-center text-white">
          <p className="text-gold-300 font-semibold text-sm uppercase tracking-widest mb-2">100% Pure Vegetarian</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">Our Menu 🍽️</h1>
          <p className="text-white/70 text-lg">Fresh, homestyle cooking — made every morning</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* ── Search & Filters ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso/40" />
            <input
              type="text"
              placeholder="Search for Poha, Idli, Chai..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input pl-10 pr-10"
            />
            {search && (
              <button onClick={() => { setSearch(''); setDebouncedSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Layout toggle */}
          <div className="flex items-center gap-1 bg-warm-200 rounded-xl p-1 h-11">
            <button onClick={() => setLayout('grid')}
              className={`p-2 rounded-lg transition-all ${layout === 'grid' ? 'bg-white shadow-warm-sm' : 'text-espresso/50 hover:text-espresso'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setLayout('list')}
              className={`p-2 rounded-lg transition-all ${layout === 'list' ? 'bg-white shadow-warm-sm' : 'text-espresso/50 hover:text-espresso'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
                ${category === cat
                  ? 'bg-saffron-900 text-white shadow-warm-sm'
                  : 'bg-ivory text-espresso hover:bg-warm-200 border border-warm-200'}`}>
              <span>{CATEGORY_EMOJIS[cat]}</span>
              {cat}
            </button>
          ))}
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
            {/* Today's Specials */}
            {specials.length > 0 && category === 'All' && !debouncedSearch && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rangoli-divider flex-1" />
                  <h2 className="font-display font-bold text-xl text-espresso flex items-center gap-2">
                    ⭐ Today's Specials
                  </h2>
                  <div className="rangoli-divider flex-1" />
                </div>
                <div className={layout === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'flex flex-col gap-3'}>
                  {specials.map((item: Parameters<typeof MenuCard>[0]['item']) => (
                    <MenuCard key={item._id} item={item} layout={layout} />
                  ))}
                </div>
              </div>
            )}

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
                  <p className="text-sm text-espresso/60 mb-4 font-medium">
                    Showing {items.length} item{items.length !== 1 ? 's' : ''}
                    {category !== 'All' ? ` in "${category}"` : ''}
                  </p>
                )}
                <div className={layout === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'flex flex-col gap-3'}>
                  {(category === 'All' && !debouncedSearch ? nonSpecials : items).map(
                    (item: Parameters<typeof MenuCard>[0]['item']) => (
                      <MenuCard key={item._id} item={item} layout={layout} />
                    )
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
