'use client';

import { useQuery } from 'react-query';
import { customerApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';
import { Search, Users, X, Package, Clock } from 'lucide-react';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: customerDetail, isLoading: isCustomerLoading } = useQuery(
    ['admin-customer', selectedCustomerId],
    () => customerApi.getOne(selectedCustomerId as string).then((r) => r.data),
    { enabled: !!selectedCustomerId }
  );

  const { data, isLoading } = useQuery(
    ['admin-customers', debSearch],
    () => customerApi.getAll(debSearch ? { search: debSearch } : {}).then((r) => r.data)
  );

  return (
    <div className="p-4 md:p-8">
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
            <div 
              key={c._id} 
              className="card p-4 flex items-center gap-4 cursor-pointer hover:border-saffron-300 transition-colors"
              onClick={() => setSelectedCustomerId(c._id)}
            >
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

      {/* Customer Details Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-bold text-xl text-espresso">Customer Details</h2>
              <button 
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              {isCustomerLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : customerDetail ? (
                <div className="space-y-8">
                  {/* Customer Info Card */}
                  <div className="bg-saffron-50/50 rounded-xl p-6 border border-saffron-100">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-saffron-gradient rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {customerDetail.customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-espresso">{customerDetail.customer.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">Email:</span> {customerDetail.customer.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">Phone:</span> {customerDetail.customer.phone}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">Joined:</span> {formatDate(customerDetail.customer.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-saffron-200/50">
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Orders</p>
                        <p className="font-bold text-xl text-espresso">{customerDetail.stats.totalOrders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Spend</p>
                        <p className="font-bold text-xl text-saffron-600">{formatCurrency(customerDetail.stats.totalSpend)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order History */}
                  <div>
                    <h3 className="font-bold text-lg text-espresso flex items-center gap-2 mb-4">
                      <Package className="w-5 h-5 text-saffron-500" />
                      Order History
                    </h3>
                    
                    {customerDetail.orders && customerDetail.orders.length > 0 ? (
                      <div className="space-y-3">
                        {customerDetail.orders.map((order: any) => (
                          <div key={order._id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-espresso">Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-saffron-600 flex items-center gap-1 justify-end">
                                  {formatCurrency(order.totalAmount)}
                                </p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                                  order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {order.orderStatus}
                                </span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded p-3 text-sm">
                              <p className="font-medium text-gray-700 mb-2">Items:</p>
                              <ul className="space-y-1">
                                {order.items.map((item: any, idx: number) => (
                                  <li key={idx} className="flex justify-between text-gray-600">
                                    <span>{item.quantity}x {item.name || 'Unknown Item'}</span>
                                    <span>{formatCurrency(item.price * item.quantity)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No orders found for this customer.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-red-500">
                  Failed to load customer details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
