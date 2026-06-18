/**
 * lib/utils.ts — Utility helpers
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupee */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format date in Indian locale */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format time in IST */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Format date + time together */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/** Generate WhatsApp link */
export function getWhatsAppLink(phone: string, message?: string): string {
  const encoded = encodeURIComponent(message || 'Hello! I would like to know more about Annada Pure Veg.');
  return `https://wa.me/${phone}?text=${encoded}`;
}

/** Truncate long text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/** Order status display data */
export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  placed:           { label: 'Order Placed',      color: 'text-blue-600 bg-blue-50',   icon: '📋' },
  confirmed:        { label: 'Confirmed',          color: 'text-purple-600 bg-purple-50', icon: '✅' },
  preparing:        { label: 'Preparing',          color: 'text-gold-800 bg-gold-50',   icon: '👨‍🍳' },
  ready:            { label: 'Ready',              color: 'text-leaf bg-leaf/10',       icon: '🔔' },
  out_for_delivery: { label: 'Out for Delivery',   color: 'text-saffron-900 bg-saffron-50', icon: '🛵' },
  delivered:        { label: 'Delivered',          color: 'text-leaf bg-leaf/10',       icon: '🎉' },
  cancelled:        { label: 'Cancelled',          color: 'text-red-600 bg-red-50',     icon: '❌' },
};

/** Tiffin plan display name */
export function getTiffinPlanName(planType: string, mealType: string): string {
  const plan = planType.charAt(0).toUpperCase() + planType.slice(1);
  const meal = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  return `${plan} ${meal}`;
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
