'use client';

import { useQuery } from 'react-query';
import { analyticsApi, orderApi, settingsApi } from '@/lib/api';
import { formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { SkeletonStatCard } from '@/components/SkeletonCard';
import { TrendingUp, ShoppingBag, Users, UtensilsCrossed, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { settingsApi as sApi } from '@/lib/api';

export default function AdminDashboard() {
  const [toggling, setToggling] = useState(false);

  const { data: dashData, isLoading } = useQuery('admin-dashboard', () =>
    analyticsApi.dashboard().then((r) => r.data.dashboard), { refetchInterval: 60000 }
  );

  const { data: settingsData, refetch: refetchSettings } = useQuery('admin-settings',
    () => settingsApi.get().then((r) => r.data.settings)
  );

  const { data: recentOrdersData } = useQuery('admin-recent-orders',
    () => orderApi.getAllOrders({ limit: '8', sort: 'createdAt' }).then((r) => r.data)
  );

  const handleToggleStore = async () => {
    setToggling(true);
    try {
      const res = await sApi.toggleStore();
      toast.success(res.data.message);
      refetchSettings();
    } catch {
      toast.error('Could not toggle store status');
    } finally {
      setToggling(false);
    }
  };

  const stats = [
    {
      label: "Today's Revenue",
      value: dashData ? formatCurrency(dashData.todayRevenue) : '—',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-saffron-50 text-saffron-900',
      sub: `${dashData?.todayOrders ?? 0} orders today`,
    },
    {
      label: 'New Customers Today',
      value: dashData?.newCustomers ?? '—',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-gold-50 text-gold-700',
      sub: 'Registered today',
    },
    {
      label: 'Active Tiffin Subs',
      value: dashData?.activeTiffins ?? '—',
      icon: <UtensilsCrossed className="w-5 h-5" />,
      color: 'bg-leaf/10 text-leaf',
      sub: 'Currently active',
    },
    {
      label: "Today's Best Seller",
      value: dashData?.bestSellerToday?.name ?? '—',
      icon: <ShoppingBag className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-700',
      sub: dashData?.bestSellerToday ? `${dashData.bestSellerToday.count} sold` : 'No orders yet',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-espresso">Dashboard</h1>
          <p className="text-espresso/60 text-sm mt-0.5">Welcome back! Here's today's summary.</p>
        </div>

        {/* Store toggle */}
        <button onClick={handleToggleStore} disabled={toggling}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
            settingsData?.isOpen
              ? 'bg-leaf/10 border-leaf text-leaf hover:bg-leaf/20'
              : 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
          }`}>
          {settingsData?.isOpen
            ? <><ToggleRight className="w-5 h-5" /> Store Open</>
            : <><ToggleLeft className="w-5 h-5" /> Store Closed</>
          }
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? [1,2,3,4].map((i) => <SkeletonStatCard key={i} />)
          : stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}>
                {s.icon}
              </div>
              <p className="text-espresso/60 text-xs font-medium">{s.label}</p>
              <p className="font-display font-bold text-espresso text-xl mt-0.5 truncate">{s.value}</p>
              <p className="text-espresso/40 text-xs mt-0.5">{s.sub}</p>
            </div>
          ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-display font-semibold text-espresso mb-4">Revenue — Last 7 Days</h2>
          {dashData?.last7DaysChart ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dashData.last7DaysChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#2C181080' }} />
                <YAxis tick={{ fontSize: 11, fill: '#2C181080' }} />
                <Tooltip
                  contentStyle={{ background: '#FFF8F0', border: '1px solid #FFE4C4', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#E65100" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] skeleton-shimmer rounded-xl" />
          )}
        </div>

        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-espresso">Recent Orders</h2>
            <a href="/admin/orders" className="text-xs text-saffron-900 font-semibold hover:underline">View all →</a>
          </div>
          <div className="space-y-3">
            {(recentOrdersData?.orders ?? []).slice(0, 6).map((order: {
              _id: string;
              orderNumber: string;
              orderStatus: string;
              totalAmount: number;
              user: { name: string };
              createdAt: string;
            }) => {
              const sc = ORDER_STATUS_CONFIG[order.orderStatus];
              return (
                <div key={order._id} className="flex items-center gap-3">
                  <span className="text-lg">{sc?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-espresso">#{order.orderNumber}</p>
                    <p className="text-[10px] text-espresso/50 truncate">{order.user?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-saffron-900">{formatCurrency(order.totalAmount)}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sc?.color}`}>
                      {sc?.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
