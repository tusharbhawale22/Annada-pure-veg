'use client';

import { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function CartDrawer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    items, isOpen, closeCart,
    updateQuantity, removeItem, clearCart,
    getTotalItems, getTotalPrice,
  } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-espresso/40 backdrop-blur-sm z-40 drawer-backdrop"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-sm z-50',
          'bg-cream shadow-warm-xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-warm-200 bg-ivory">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-saffron-900" />
            <h2 className="font-display font-bold text-lg text-espresso">
              Your Cart
            </h2>
            {totalItems > 0 && (
              <span className="bg-saffron-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <button
              onClick={closeCart}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-warm-200 transition-colors"
            >
              <X className="w-5 h-5 text-espresso" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="text-7xl">🛒</div>
              <div>
                <p className="font-display font-bold text-xl text-espresso mb-1">
                  Your cart is empty
                </p>
                <p className="text-sm text-espresso/60">
                  Add some delicious items from our menu!
                </p>
              </div>
              <button onClick={closeCart} className="btn-primary mt-2">
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center gap-3 bg-ivory rounded-xl p-3 border border-warm-200"
                >
                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-warm-200 flex-shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-espresso text-sm truncate">{item.name}</p>
                    <p className="text-saffron-900 font-bold text-sm mt-0.5">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (item.quantity === 1) removeItem(item._id);
                        else updateQuantity(item._id, item.quantity - 1);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-warm-200 hover:bg-warm-300 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-sm text-espresso w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-saffron-900 text-white hover:bg-saffron-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with total + checkout */}
        {items.length > 0 && (
          <div className="border-t border-warm-200 p-4 bg-ivory space-y-3">
            {/* Subtotal */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-espresso/70">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-semibold">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-espresso/70">
                <span>Delivery</span>
                <span className="text-leaf font-semibold">
                  {totalPrice >= 300 ? 'FREE 🎉' : formatCurrency(30)}
                </span>
              </div>
              {totalPrice < 300 && (
                <p className="text-xs text-espresso/50 text-right">
                  Add {formatCurrency(300 - totalPrice)} more for free delivery!
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="rangoli-divider" />

            {/* Total */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-espresso/60 font-medium">Total (incl. taxes)</p>
                <p className="font-display font-bold text-xl text-espresso">
                  {formatCurrency(totalPrice + (totalPrice >= 300 ? 0 : 30))}
                </p>
              </div>
              <Link href="/checkout" onClick={closeCart} className="btn-primary gap-2">
                Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-xs text-center text-espresso/50">
              🌿 100% Pure Vegetarian — No preservatives added
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
