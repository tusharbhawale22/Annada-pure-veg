'use client';

import { useQuery } from 'react-query';
import { customerApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';
import { Search, Users } from 'lucide-react';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [debSearch, setDebSearch] = useState('');

  const { data, isLoading } = useQuery(
    ['admin-customers', debSearch],
    () => customerApi.getAll(debSearch ? { search: debSearch } : {}).then((r) => r.data)
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-espresso">Customers</h1>
        <div className="flex items-center gap-2 bg-saffron-50 text-saffron-900 px-3 py-1.5 rounded-xl text-sm font-semibold">
          <Users className="w-4 h-4" />
          {data?.pagination?.total ?? 0} total
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso/40" />
        <input className="input pl-9" placeholder="Search name, email or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            clearTimeout((window as unknown as { searchTimer?: ReturnType<typeof setTimeout> }).searchTimer);
            (window as unknown as { searchTimer?: ReturnType<typeof setTimeout> }).searchTimer = setTimeout(() => setDebSearch(e.target.value), 400);
          }} />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {(data?.customers ?? []).map((c: {
            _id: string;
            name: string;
            email: string;
            phone: string;
            createdAt: string;
            orderCount: number;
            totalSpend: number;
          }) => (
            <div key={c._id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-saffron-gradient rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-espresso text-sm">{c.name}</p>
                <p className="text-xs text-espresso/60">{c.email} · {c.phone}</p>
                <p className="text-xs text-espresso/40">Joined {formatDate(c.createdAt)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-saffron-900 text-sm">{formatCurrency(c.totalSpend)}</p>
                <p className="text-xs text-espresso/50">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
          {data?.customers?.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">👥</p>
              <p className="font-display font-bold text-xl text-espresso">No customers found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
