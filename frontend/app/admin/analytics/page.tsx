'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { settingsApi, menuApi, analyticsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#E65100', '#F9A825', '#388E3C', '#7B1FA2', '#1976D2'];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: topItemsData } = useQuery(
    ['top-items', days],
    () => analyticsApi.topItems({ days: String(days), limit: '8' }).then((r) => r.data.topItems)
  );

  const { data: revenueData } = useQuery(
    ['revenue', days],
    () => analyticsApi.revenue({ from: new Date(Date.now() - days * 86400000).toISOString() }).then((r) => r.data.revenue)
  );

  const { data: dashboard } = useQuery('admin-dashboard-analytics',
    () => analyticsApi.dashboard().then((r) => r.data.dashboard)
  );

  const chartData = dashboard?.last7DaysChart ?? [];

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-espresso">Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${days === d ? 'bg-saffron-900 text-white' : 'bg-ivory border border-warm-200 text-espresso hover:bg-warm-200'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: revenueData ? formatCurrency(revenueData.total) : '—', icon: '💰' },
          { label: 'Total Orders',  value: revenueData?.totalOrders ?? '—',                       icon: '📦' },
          { label: "Today's Orders",value: dashboard?.todayOrders ?? '—',                         icon: '🛵' },
          { label: 'Active Tiffins',value: dashboard?.activeTiffins ?? '—',                       icon: '🍱' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <p className="text-2xl mb-2">{s.icon}</p>
            <p className="font-display font-bold text-espresso text-2xl">{s.value}</p>
            <p className="text-espresso/50 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders over time */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-espresso mb-4">Orders — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#2C181080' }} />
              <YAxis tick={{ fontSize: 11, fill: '#2C181080' }} />
              <Tooltip contentStyle={{ background: '#FFF8F0', border: '1px solid #FFE4C4', borderRadius: '12px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="orders" stroke="#F9A825" strokeWidth={2} dot={{ fill: '#F9A825', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue over time */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-espresso mb-4">Revenue — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#2C181080' }} />
              <YAxis tick={{ fontSize: 11, fill: '#2C181080' }} />
              <Tooltip contentStyle={{ background: '#FFF8F0', border: '1px solid #FFE4C4', borderRadius: '12px', fontSize: '12px' }}
                formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
              <Bar dataKey="revenue" fill="#E65100" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-display font-semibold text-espresso mb-4">Top Selling Items ({days}d)</h2>
          {topItemsData ? (
            <div className="space-y-3">
              {topItemsData.map((item: { name: string; quantity: number; revenue: number }, idx: number) => {
                const maxQty = topItemsData[0]?.quantity || 1;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-espresso">{idx + 1}. {item.name}</span>
                      <span className="text-espresso/60 font-semibold">{item.quantity} sold · {formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="h-2 bg-warm-200 rounded-full">
                      <div className="h-full bg-saffron-gradient rounded-full transition-all"
                        style={{ width: `${(item.quantity / maxQty) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-8 skeleton-shimmer rounded-lg" />)}</div>
          )}
        </div>

        {/* Revenue by category pie */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-espresso mb-4">Revenue Breakdown</h2>
          {revenueData?.byCategory && revenueData.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={revenueData.byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {revenueData.byCategory.map((_: unknown, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-espresso/40 text-sm">
              Not enough data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
