'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const STEPS = [
  { key: 'placed',           label: 'Order\nPlaced',        icon: '📋' },
  { key: 'confirmed',        label: 'Confirmed',            icon: '✅' },
  { key: 'preparing',        label: 'Preparing',            icon: '👨‍🍳' },
  { key: 'ready',            label: 'Ready',                icon: '🔔' },
  { key: 'out_for_delivery', label: 'Out for\nDelivery',   icon: '🛵' },
  { key: 'delivered',        label: 'Delivered',            icon: '🎉' },
];

const STATUS_ORDER = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

interface OrderStepperProps {
  currentStatus: string;
  statusHistory?: Array<{ status: string; timestamp: string; note?: string }>;
  orderType?: 'delivery' | 'pickup';
}

export default function OrderStepper({ currentStatus, statusHistory = [], orderType = 'delivery' }: OrderStepperProps) {
  // For pickup, skip out_for_delivery step
  const steps = orderType === 'pickup'
    ? STEPS.filter((s) => s.key !== 'out_for_delivery')
    : STEPS;

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const isCancelled  = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-4xl mb-2">❌</p>
        <p className="font-display font-bold text-red-700 text-lg">Order Cancelled</p>
        <p className="text-sm text-red-500 mt-1">This order has been cancelled.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-start justify-between min-w-max px-2 py-4 gap-2">
        {steps.map((step, index) => {
          const stepIndex   = STATUS_ORDER.indexOf(step.key);
          const isCompleted = currentIndex > stepIndex || currentStatus === 'delivered';
          const isCurrent   = currentIndex === stepIndex;

          const historyEntry = statusHistory.find((h) => h.status === step.key);

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 relative flex-1">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-warm-300 -z-0">
                  <div
                    className="h-full bg-saffron-900 transition-all duration-700"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}

              {/* Step circle */}
              <div className={cn(
                'relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg transition-all duration-300',
                isCompleted ? 'bg-saffron-900 border-saffron-900 scale-110' :
                isCurrent   ? 'bg-gold-800 border-gold-800 scale-110 ring-4 ring-gold-200' :
                              'bg-white border-warm-300'
              )}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : isCurrent ? (
                  <span>{step.icon}</span>
                ) : (
                  <Circle className="w-5 h-5 text-warm-300" />
                )}

                {/* Pulse for current step */}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full bg-gold-400 opacity-30 animate-ping" />
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <p className={cn(
                  'text-xs font-semibold whitespace-pre-line text-center leading-tight',
                  isCompleted ? 'text-saffron-900' :
                  isCurrent   ? 'text-gold-700' :
                                'text-espresso/40'
                )}>
                  {step.label}
                </p>
                {historyEntry && (
                  <p className="text-[10px] text-espresso/40 mt-0.5 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(historyEntry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
