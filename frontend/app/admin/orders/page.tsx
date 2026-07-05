'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { orderApi, menuApi, settingsApi } from '@/lib/api';
import { formatCurrency, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, ChevronDown, Plus, Minus, X, Printer, Eye, MapPin, CreditCard, User, Phone, Package, CheckCircle } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [status, setStatus]   = useState('all');
  const [search, setSearch]   = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  // Modals visibility
  const [showAddOffline, setShowAddOffline] = useState(false);
  const [showInvoice, setShowInvoice]       = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder]   = useState<any | null>(null);
  const [markingPaid, setMarkingPaid]       = useState(false);

  // Offline Order Form State
  const [offlineCart, setOfflineCart] = useState<any[]>([]);
  const [offlineCustomerName, setOfflineCustomerName] = useState('Walk-in Customer');
  const [offlineCustomerPhone, setOfflineCustomerPhone] = useState('');
  const [offlineOrderType, setOfflineOrderType] = useState('dine-in');
  const [offlinePaymentMethod, setOfflinePaymentMethod] = useState('cash');
  const [offlinePaymentStatus, setOfflinePaymentStatus] = useState('paid');
  const [offlineNotes, setOfflineNotes] = useState('');
  const [offlineSearch, setOfflineSearch] = useState('');
  const [offlineDeliveryAddress, setOfflineDeliveryAddress] = useState({
    line1: '',
    area: 'Wadgaon Sheri',
    pincode: '411014',
    landmark: ''
  });

  const params: Record<string, string> = {};
  if (status !== 'all') params.status = status;
  if (search) params.search = search;

  const { data, isLoading, refetch } = useQuery(
    ['admin-orders', status, search],
    () => orderApi.getAllOrders(params).then((r) => r.data),
    { 
      keepPreviousData: true,
      refetchInterval: 10000 // Poll every 10 seconds for real-time order updates
    }
  );

  const { data: settingsData } = useQuery('store-settings', () => settingsApi.get().then(r => r.data));
  const settings = settingsData?.settings || {};

  const seenOrderIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (data?.orders) {
      let newCount = 0;
      data.orders.forEach((o: any) => {
        if (!seenOrderIds.current.has(o._id)) {
          newCount++;
          seenOrderIds.current.add(o._id);
        }
      });
      
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return; // Skip alert on very first load
      }

      if (newCount > 0) {
        toast.success(`🔔 ${newCount} New Order(s) Received!`, {
          duration: 6000,
          icon: '🚨',
          style: { background: '#FFF3CD', color: '#856404', fontWeight: 'bold' }
        });
      }
    }
  }, [data?.orders]);

  const { data: menuData } = useQuery(
    'admin-menu-items',
    () => menuApi.getItems().then((r) => r.data)
  );

  const orders = data?.orders ?? [];
  const menuItems = menuData?.items ?? [];

  const handleStatusUpdate = async (orderId: string, newStatus: string, order?: any) => {
    // Block status change if razorpay payment is not done
    if (order && order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid') {
      toast.error('❌ Cannot update status — payment not completed yet!');
      return;
    }
    setUpdating(orderId);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus} ✅`);
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    setMarkingPaid(true);
    try {
      await orderApi.updatePaymentStatus(orderId, newPaymentStatus);
      toast.success(`Payment status updated to ${newPaymentStatus} ✅`);
      refetch();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev: any) => prev ? {
          ...prev,
          paymentStatus: newPaymentStatus,
          orderStatus: newPaymentStatus === 'paid' && prev.orderStatus === 'placed' ? 'confirmed' : prev.orderStatus
        } : prev);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update payment status');
    } finally {
      setMarkingPaid(false);
    }
  };

  // Offline Order logic
  const handleAddToOfflineCart = (menuItem: any) => {
    const existing = offlineCart.find((i) => i.menuItem === menuItem._id);
    if (existing) {
      setOfflineCart(
        offlineCart.map((i) =>
          i.menuItem === menuItem._id ? { ...i, quantity: Math.min(20, i.quantity + 1) } : i
        )
      );
    } else {
      setOfflineCart([
        ...offlineCart,
        {
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveFromOfflineCart = (menuItemId: string) => {
    setOfflineCart(offlineCart.filter((i) => i.menuItem !== menuItemId));
  };

  const handleQtyChange = (menuItemId: string, change: number) => {
    setOfflineCart(
      offlineCart
        .map((i) => {
          if (i.menuItem === menuItemId) {
            const newQty = i.quantity + change;
            return newQty > 0 ? { ...i, quantity: Math.min(20, newQty) } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  // Calculations for Offline Order
  const offlineSubtotal = offlineCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const offlineDeliveryFee = offlineOrderType === 'delivery' && offlineSubtotal < (settings.freeDeliveryAbove || 300) ? (settings.deliveryFee || 30) : 0;
  const offlineTax = Math.round(((offlineSubtotal + offlineDeliveryFee) * 5) / 100);
  const offlineTotal = offlineSubtotal + offlineDeliveryFee + offlineTax;

  const handleCreateOfflineOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offlineCart.length === 0) {
      toast.error('Add at least one item to order 🛒');
      return;
    }

    if (offlineCustomerPhone && !/^[6-9]\d{9}$/.test(offlineCustomerPhone)) {
      toast.error('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const payload = {
      items: offlineCart,
      orderType: offlineOrderType,
      paymentMethod: offlinePaymentMethod,
      paymentStatus: offlinePaymentStatus,
      customerName: offlineCustomerName,
      customerPhone: offlineCustomerPhone,
      deliveryAddress: offlineOrderType === 'delivery' ? offlineDeliveryAddress : undefined,
      notes: offlineNotes,
    };

    try {
      await orderApi.createOffline(payload);
      toast.success('Offline order created successfully! 📝');
      refetch();
      // Reset form
      setOfflineCart([]);
      setOfflineCustomerName('Walk-in Customer');
      setOfflineCustomerPhone('');
      setOfflineOrderType('dine-in');
      setOfflinePaymentMethod('cash');
      setOfflinePaymentStatus('paid');
      setOfflineNotes('');
      setShowAddOffline(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create offline order');
    }
  };

  const filteredMenuItems = menuItems.filter((item: any) =>
    item.isAvailable && item.name.toLowerCase().includes(offlineSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible !important;
          }
          #print-invoice-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          /* Reset layout styles on fixed / scrollable backdrop parent containers during print */
          .fixed, .absolute, .relative {
            position: static !important;
            overflow: visible !important;
            max-height: none !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          /* Eliminate default page headers/footers in printing */
          @page {
            margin: 0;
          }
        }
      `}} />

      {/* Header */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="font-display text-xl md:text-2xl font-bold text-espresso">Orders</h1>
        <button
          onClick={() => setShowAddOffline(true)}
          className="px-3 md:px-4 py-2 bg-leaf text-white hover:bg-leaf-700 rounded-xl font-semibold flex items-center gap-1.5 transition-all shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add </span>Offline Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso/40" />
          <input className="input pl-9 py-2.5" placeholder="Search order number..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                status === s ? 'bg-saffron-900 text-white' : 'bg-ivory border border-warm-200 text-espresso hover:bg-warm-200'
              }`}>
              {s === 'all' ? 'All Orders' : ORDER_STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-display font-bold text-xl text-espresso">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: {
            _id: string;
            orderNumber: string;
            orderStatus: string;
            orderType: string;
            paymentMethod: string;
            paymentStatus: string;
            totalAmount: number;
            createdAt: string;
            isOffline?: boolean;
            customerName?: string;
            customerPhone?: string;
            user?: { name: string; phone: string };
            items: { name: string; quantity: number }[];
          }) => {
            const sc = ORDER_STATUS_CONFIG[order.orderStatus];
            const nextStatuses = Object.keys(ORDER_STATUS_CONFIG).filter(
              (s) => s !== 'placed' && s !== 'cancelled' && s !== order.orderStatus
            );

            const displayCustomerName = order.isOffline ? order.customerName : (order.user?.name || 'Walk-in Customer');
            const displayCustomerPhone = order.isOffline ? order.customerPhone : (order.user?.phone || '');

            return (
              <div
                key={order._id}
                className="card p-4 flex flex-wrap items-center gap-4 cursor-pointer hover:border-saffron-300 hover:shadow-md transition-all"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowOrderDetail(true);
                }}
              >
                <div className="text-2xl">{sc?.icon}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-espresso text-sm">#{order.orderNumber}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc?.color}`}>{sc?.label}</span>
                    <span className="text-xs text-espresso/50 capitalize">{order.orderType}</span>
                    {order.isOffline && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warm-200 text-espresso/70">Offline</span>
                    )}
                  </div>
                  <p className="text-xs text-espresso/60 mt-0.5">
                    {displayCustomerName} {displayCustomerPhone ? `· ${displayCustomerPhone}` : ''} · {formatDateTime(order.createdAt)}
                  </p>
                  <p className="text-xs text-espresso/50 mt-0.5 truncate">
                    {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                  </p>
                </div>

                <div className="text-right flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <p className="font-bold text-saffron-900">{formatCurrency(order.totalAmount)}</p>
                    <p className={`text-xs font-semibold ${order.paymentStatus === 'paid' ? 'text-leaf' : 'text-gold-700'}`}>
                      {order.paymentStatus.toUpperCase()} · {order.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                      setShowInvoice(true);
                    }}
                    className="p-2 border border-warm-300 rounded-xl text-espresso/70 hover:bg-warm-100 hover:text-espresso transition-all flex items-center gap-1.5"
                    title="Print Bill"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>

                {/* Status updater */}
                {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value, order)}
                      disabled={updating === order._id}
                      className="appearance-none pr-7 pl-3 py-2 rounded-xl border-2 border-warm-200 text-sm font-semibold text-espresso bg-white hover:border-saffron-300 focus:outline-none focus:border-saffron-900 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <option value={order.orderStatus}>{sc?.label}</option>
                      {nextStatuses.map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS_CONFIG[s]?.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso/50 pointer-events-none" />
                    {updating === order._id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                        <span className="w-4 h-4 border-2 border-saffron-900 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowOrderDetail(false); setSelectedOrder(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-warm-200 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h3 className="font-display font-bold text-lg text-espresso">Order #{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-espresso/50 mt-0.5">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => { setShowOrderDetail(false); setSelectedOrder(null); }} className="p-1.5 rounded-full hover:bg-warm-100 transition-colors">
                <X className="w-5 h-5 text-espresso/50" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Payment warning banner */}
              {selectedOrder.paymentMethod === 'razorpay' && selectedOrder.paymentStatus !== 'paid' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-red-700 text-sm">⚠️ Payment Not Completed</p>
                    <p className="text-xs text-red-600 mt-1">This Razorpay order has not been paid. Order status cannot be changed until payment is confirmed.</p>
                  </div>
                </div>
              )}

              {/* Status & Type */}
              <div className="flex flex-wrap gap-2">
                {(() => { const sc = ORDER_STATUS_CONFIG[selectedOrder.orderStatus]; return (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${sc?.color}`}>{sc?.icon} {sc?.label}</span>
                ); })()}
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-warm-100 text-espresso/70 capitalize">{selectedOrder.orderType}</span>
                {selectedOrder.isOffline && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">Offline Order</span>}
              </div>

              {/* Customer Info */}
              <div className="bg-ivory rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-espresso text-sm flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-saffron-900" /> Customer Details
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5 text-espresso/40" />
                  <span className="font-semibold text-espresso">
                    {selectedOrder.isOffline ? selectedOrder.customerName : (selectedOrder.user?.name || 'Walk-in Customer')}
                  </span>
                </div>
                {(selectedOrder.isOffline ? selectedOrder.customerPhone : selectedOrder.user?.phone) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3.5 h-3.5 text-espresso/40" />
                    <span className="text-espresso/70">
                      {selectedOrder.isOffline ? selectedOrder.customerPhone : selectedOrder.user?.phone}
                    </span>
                  </div>
                )}
                {selectedOrder.user?.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-espresso/40">✉</span>
                    <span className="text-espresso/60">{selectedOrder.user.email}</span>
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              {selectedOrder.orderType === 'delivery' && selectedOrder.deliveryAddress && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-bold text-espresso text-sm flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-500" /> Delivery Address
                  </h4>
                  <p className="text-sm text-espresso/80 leading-relaxed">
                    {selectedOrder.deliveryAddress.line1}<br />
                    {selectedOrder.deliveryAddress.area} — {selectedOrder.deliveryAddress.pincode}
                    {selectedOrder.deliveryAddress.landmark && <><br /><span className="text-espresso/50">{selectedOrder.deliveryAddress.landmark}</span></>}
                  </p>
                </div>
              )}

              {/* Items Ordered */}
              <div>
                <h4 className="font-bold text-espresso text-sm flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-saffron-900" /> Items Ordered
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-ivory rounded-lg p-3">
                      <div>
                        <p className="font-semibold text-espresso text-sm">{item.name}</p>
                        <p className="text-xs text-espresso/50">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-espresso/50">×{item.quantity}</p>
                        <p className="font-bold text-saffron-900 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-warm-50 rounded-xl p-4 space-y-1.5 text-sm border border-warm-200">
                <div className="flex justify-between text-espresso/60">
                  <span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-espresso/60">
                    <span>Delivery Fee</span><span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-leaf font-semibold">
                    <span>Discount</span><span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-espresso/60">
                  <span>GST (5%)</span><span>{formatCurrency(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-black text-espresso border-t border-dashed border-warm-300 pt-2 mt-1">
                  <span>TOTAL</span>
                  <span className="text-saffron-900">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-ivory rounded-xl p-4">
                <h4 className="font-bold text-espresso text-sm flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-saffron-900" /> Payment
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-espresso/50">Method</p>
                    <p className="font-bold text-espresso uppercase">{selectedOrder.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-espresso/50">Status</p>
                    <span className={`font-bold text-sm ${
                      selectedOrder.paymentStatus === 'paid' ? 'text-leaf' :
                      selectedOrder.paymentStatus === 'failed' ? 'text-red-600' :
                      'text-gold-700'
                    }`}>
                      {selectedOrder.paymentStatus === 'paid' ? '✅ PAID' :
                       selectedOrder.paymentStatus === 'failed' ? '❌ FAILED' :
                       '⏳ PENDING'}
                    </span>
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div className="mt-3 pt-3 border-t border-warm-200">
                    <p className="text-xs text-espresso/50 mb-1">Special Notes</p>
                    <p className="text-sm text-espresso/80 italic">"{selectedOrder.notes}"</p>
                  </div>
                )}
                {/* Admin payment status correction */}
                <div className="mt-3 pt-3 border-t border-warm-200">
                  <p className="text-xs text-espresso/50 mb-2 font-semibold uppercase tracking-wide">Admin: Fix Payment Status</p>
                  <div className="flex gap-2">
                    {selectedOrder.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => handleUpdatePaymentStatus(selectedOrder._id, 'paid')}
                        disabled={markingPaid}
                        className="flex-1 px-3 py-2 bg-leaf/10 hover:bg-leaf/20 text-leaf border border-leaf/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {markingPaid ? 'Updating...' : '✅ Mark as PAID'}
                      </button>
                    )}
                    {selectedOrder.paymentStatus !== 'pending' && (
                      <button
                        onClick={() => handleUpdatePaymentStatus(selectedOrder._id, 'pending')}
                        disabled={markingPaid}
                        className="flex-1 px-3 py-2 bg-gold-50 hover:bg-gold-100 text-gold-700 border border-gold-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {markingPaid ? 'Updating...' : '⏳ Mark as PENDING'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 p-5 border-t border-warm-200 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={() => {
                  setShowOrderDetail(false);
                  setShowInvoice(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 border border-warm-300 hover:bg-warm-100 rounded-xl text-espresso font-semibold text-sm transition-all"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={() => { setShowOrderDetail(false); setSelectedOrder(null); }}
                className="flex-1 px-4 py-2.5 bg-espresso hover:bg-espresso/90 text-white rounded-xl font-bold text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-warm-200 mb-4 no-print">
              <h3 className="font-display font-bold text-lg text-espresso flex items-center gap-2">
                <Printer className="w-5 h-5 text-saffron-900" />
                Receipt Billing
              </h3>
              <button onClick={() => { setShowInvoice(false); setSelectedOrder(null); }} className="p-1 rounded-full hover:bg-warm-100">
                <X className="w-5 h-5 text-espresso/50" />
              </button>
            </div>

            {/* Printable Area */}
            <div id="print-invoice-area" className="flex-1 bg-white text-espresso p-1 select-text">
              <div className="text-center mb-6">
                <h2 className="font-display font-black text-2xl text-saffron-900 leading-tight">Annada Pure Veg 🌿</h2>
                <p className="text-[11px] text-espresso/70 mt-1 uppercase tracking-wider font-semibold">100% Pure Vegetarian Breakfast & Tiffin</p>
                <p className="text-[10px] text-espresso/60 max-w-[280px] mx-auto mt-1 leading-normal whitespace-pre-line">
                  {settings.address || 'Anand Park Bus Stop, near Sancheti Classes, Wadgaon Sheri, Pune - 411014'}
                </p>
                <p className="text-[10px] text-espresso/80 mt-0.5 font-semibold">Phone: {settings.phone || '+91 9763216146'}</p>
              </div>

              <div className="border-t border-b border-dashed border-warm-300 py-3 mb-4 text-[11px] leading-relaxed">
                <div className="flex justify-between font-semibold text-espresso">
                  <span>INVOICE: #{selectedOrder.orderNumber}</span>
                  <span>{formatDateTime(selectedOrder.createdAt)}</span>
                </div>
                <div className="mt-1.5 space-y-0.5">
                  <p><span className="text-espresso/60 font-medium">Customer:</span> <span className="font-semibold">{selectedOrder.isOffline ? selectedOrder.customerName : (selectedOrder.user?.name || 'Walk-in Customer')}</span></p>
                  {(selectedOrder.isOffline ? selectedOrder.customerPhone : selectedOrder.user?.phone) && (
                    <p><span className="text-espresso/60 font-medium">Mobile:</span> {selectedOrder.isOffline ? selectedOrder.customerPhone : selectedOrder.user?.phone}</p>
                  )}
                  <p><span className="text-espresso/60 font-medium">Order Type:</span> <span className="uppercase font-semibold text-[10px]">{selectedOrder.orderType}</span></p>
                  <p><span className="text-espresso/60 font-medium">Payment:</span> <span className="uppercase font-semibold text-[10px]">{selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</span></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-[11px] mb-4">
                <thead>
                  <tr className="border-b border-dashed border-warm-300 text-espresso/60 font-bold uppercase text-[9px] tracking-wider">
                    <th className="pb-1.5">Item</th>
                    <th className="pb-1.5 text-center w-12">Qty</th>
                    <th className="pb-1.5 text-right w-16">Price</th>
                    <th className="pb-1.5 text-right w-20">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-warm-100">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <tr key={idx} className="text-espresso">
                      <td className="py-2 pr-2 font-medium">{item.name}</td>
                      <td className="py-2 text-center font-medium">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-2 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="border-t border-dashed border-warm-300 pt-3 space-y-1.5 text-[11px] text-espresso/80 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-leaf font-semibold">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span>{formatCurrency(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-black text-espresso text-sm border-t border-dashed border-warm-300 pt-2 pb-1">
                  <span>TOTAL AMOUNT</span>
                  <span className="text-saffron-900">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="text-center mt-6 border-t border-dashed border-warm-200 pt-4">
                <p className="text-[11px] font-semibold text-espresso">Thank you for dining with us! 🌿</p>
                <p className="text-[9px] text-espresso/50 mt-0.5 uppercase tracking-wide">Ghar Jaisi Subah, Har Subah</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-warm-200 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2.5 bg-saffron-900 hover:bg-saffron-950 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-sm"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={() => { setShowInvoice(false); setSelectedOrder(null); }}
                className="px-4 py-2.5 border border-warm-300 hover:bg-warm-100 rounded-xl font-bold text-espresso text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Offline Order Modal */}
      {showAddOffline && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-warm-200 mb-4">
              <h3 className="font-display font-bold text-lg text-espresso flex items-center gap-2">
                <Plus className="w-5 h-5 text-leaf" />
                Create Offline Order
              </h3>
              <button onClick={() => setShowAddOffline(false)} className="p-1 rounded-full hover:bg-warm-100">
                <X className="w-5 h-5 text-espresso/50" />
              </button>
            </div>

            <form onSubmit={handleCreateOfflineOrder} className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-y-auto">
              
              {/* Left Column: Menu Items Search & Add */}
              <div className="flex-none h-[400px] md:h-auto md:flex-1 flex flex-col md:min-h-0 mb-6 md:mb-0">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso/40" />
                  <input
                    className="input pl-9 py-2 text-sm"
                    placeholder="Search menu items..."
                    value={offlineSearch}
                    onChange={(e) => setOfflineSearch(e.target.value)}
                  />
                </div>

                <div className="flex-1 border border-warm-200 rounded-xl overflow-y-auto p-2 bg-ivory/30 space-y-1.5">
                  {filteredMenuItems.map((item: any) => (
                    <div key={item._id} className="bg-white p-3 rounded-lg border border-warm-200 flex items-center justify-between gap-3 shadow-sm hover:border-saffron-300 transition-all">
                      <div className="min-w-0">
                        <p className="font-bold text-espresso text-sm">{item.name}</p>
                        <p className="text-xs text-saffron-900 font-semibold">{formatCurrency(item.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddToOfflineCart(item)}
                        className="px-2.5 py-1 bg-warm-100 hover:bg-saffron-100 hover:text-saffron-900 text-espresso text-xs font-bold rounded-lg border border-warm-300 transition-all"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                  {filteredMenuItems.length === 0 && (
                    <p className="text-xs text-center text-espresso/50 py-8">No available menu items found.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Cart Details & Form */}
              <div className="w-full md:w-96 flex flex-col border-t md:border-t-0 md:border-l border-warm-200 pt-6 md:pt-0 md:pl-6">
                
                {/* Cart Items List */}
                <h4 className="font-bold text-espresso text-sm mb-2 flex items-center justify-between">
                  <span>Selected Items</span>
                  <span className="text-xs bg-saffron-900/10 text-saffron-900 px-2 py-0.5 rounded-full font-semibold">{offlineCart.length} items</span>
                </h4>
                
                <div className="flex-1 min-h-[120px] max-h-[160px] border border-warm-200 rounded-xl overflow-y-auto p-2.5 bg-warm-50/50 mb-4 divide-y divide-warm-100">
                  {offlineCart.map((item) => (
                    <div key={item.menuItem} className="py-2 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-espresso truncate">{item.name}</p>
                        <p className="text-[10px] text-espresso/50 font-semibold">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.menuItem, -1)}
                          className="p-1 border border-warm-300 rounded-lg hover:bg-warm-100 text-espresso/70"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold w-6 text-center text-espresso">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.menuItem, 1)}
                          className="p-1 border border-warm-300 rounded-lg hover:bg-warm-100 text-espresso/70"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromOfflineCart(item.menuItem)}
                          className="ml-1 text-red-500 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {offlineCart.length === 0 && (
                    <p className="text-xs text-center text-espresso/40 py-8">Cart is empty. Select items on the left.</p>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-3 flex-1 overflow-y-auto mb-4 pr-1 text-xs">
                  <div>
                    <label className="block font-bold text-espresso/70 mb-1">Customer Name</label>
                    <input
                      className="input py-1.5 px-3 text-xs"
                      required
                      placeholder="e.g. Walk-in Customer"
                      value={offlineCustomerName}
                      onChange={(e) => setOfflineCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-espresso/70 mb-1">Customer Phone (Optional)</label>
                    <input
                      className="input py-1.5 px-3 text-xs"
                      type="tel"
                      placeholder="e.g. 9763216146"
                      value={offlineCustomerPhone}
                      onChange={(e) => setOfflineCustomerPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-espresso/70 mb-1">Order Type</label>
                      <select
                        className="input py-1.5 px-3 text-xs select-appearance bg-white border border-warm-300 rounded-xl w-full cursor-pointer focus:outline-none"
                        value={offlineOrderType}
                        onChange={(e) => setOfflineOrderType(e.target.value)}
                      >
                        <option value="dine-in">Dine-in</option>
                        <option value="takeaway">Takeaway</option>
                        <option value="delivery">Delivery</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-espresso/70 mb-1">Payment Method</label>
                      <select
                        className="input py-1.5 px-3 text-xs select-appearance bg-white border border-warm-300 rounded-xl w-full cursor-pointer focus:outline-none"
                        value={offlinePaymentMethod}
                        onChange={(e) => setOfflinePaymentMethod(e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="cod">COD</option>
                      </select>
                    </div>
                  </div>

                  {offlineOrderType === 'delivery' && (
                    <div className="p-3 bg-warm-50 rounded-xl border border-warm-200 space-y-2.5">
                      <p className="font-bold text-espresso text-[11px] uppercase tracking-wide text-espresso/60">Delivery Address</p>
                      <div>
                        <input
                          className="input py-1 px-2.5 text-xs bg-white"
                          required
                          placeholder="Line 1 / Address Details"
                          value={offlineDeliveryAddress.line1}
                          onChange={(e) => setOfflineDeliveryAddress({ ...offlineDeliveryAddress, line1: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="input py-1 px-2.5 text-xs bg-white"
                          required
                          placeholder="Area"
                          value={offlineDeliveryAddress.area}
                          onChange={(e) => setOfflineDeliveryAddress({ ...offlineDeliveryAddress, area: e.target.value })}
                        />
                        <input
                          className="input py-1 px-2.5 text-xs bg-white"
                          required
                          placeholder="Pincode"
                          maxLength={6}
                          value={offlineDeliveryAddress.pincode}
                          onChange={(e) => setOfflineDeliveryAddress({ ...offlineDeliveryAddress, pincode: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-espresso/70 mb-1">Payment Status</label>
                      <select
                        className="input py-1.5 px-3 text-xs select-appearance bg-white border border-warm-300 rounded-xl w-full cursor-pointer focus:outline-none"
                        value={offlinePaymentStatus}
                        onChange={(e) => setOfflinePaymentStatus(e.target.value)}
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-espresso/70 mb-1">Special Notes (Optional)</label>
                      <input
                        className="input py-1.5 px-3 text-xs"
                        placeholder="e.g. No spicy, no onion"
                        value={offlineNotes}
                        onChange={(e) => setOfflineNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Calculations Summary */}
                <div className="bg-warm-50/70 p-3 rounded-xl border border-warm-200 text-xs space-y-1 mb-4 font-medium text-espresso/80">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(offlineSubtotal)}</span>
                  </div>
                  {offlineOrderType === 'delivery' && (
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{formatCurrency(offlineDeliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST Tax (5%)</span>
                    <span>{formatCurrency(offlineTax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-espresso border-t border-dashed border-warm-300 pt-1.5 mt-1">
                    <span>Total Amount</span>
                    <span className="text-saffron-900">{formatCurrency(offlineTotal)}</span>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={offlineCart.length === 0}
                    className="flex-1 px-4 py-2 bg-leaf hover:bg-leaf-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-xs py-2.5"
                  >
                    Submit Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddOffline(false)}
                    className="px-4 py-2 border border-warm-300 hover:bg-warm-100 rounded-xl text-espresso text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
