import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle2, Utensils, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../lib/api.js';
import { useEventSource } from '../hooks/useEventSource.js';
import { formatPaise, formatTimeAgo } from '../lib/utils.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import type { OrderStatus } from '../types/index.js';

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; desc: string }> = [
  { key: 'RECEIVED', label: 'Order Received', desc: 'Sent to kitchen for preparation' },
  { key: 'PREPARING', label: 'Preparing', desc: 'Our chefs are actively cooking' },
  { key: 'READY', label: 'Ready', desc: 'Plated and ready for pickup' },
  { key: 'SERVED', label: 'Served', desc: 'Completed and enjoyed' },
];

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) throw new Error('Order ID is required');
      const res = await api.orders.getById(id);
      return res.order;
    },
    enabled: Boolean(id),
  });

  const order = data;

  // Live SSE connection scoped to this specific order ID
  const { status: sseStatus } = useEventSource(`/events/orders/${id}`, {
    events: ['order.updated'],
    enabled: Boolean(id),
    onMessage: (event) => {
      if (event.data?.id === id) {
        refetch();
      }
    },
    onReconnect: () => {
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-sm font-semibold text-muted">Retrieving order status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-danger flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold font-serif text-foreground">Order Not Found</h2>
        <p className="text-xs text-muted mt-2">
          We could not locate this order. Please verify your order link or place a new order.
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button variant="primary">Return to Menu</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Navigation back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </Link>

        {/* Order Card Container */}
        <div className="bg-card rounded-3xl border border-border p-6 shadow-soft text-left">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
                  Order {order.orderNumber || `#${order.id.slice(0, 6)}`}
                </h1>
                <Badge orderType={order.orderType} />
              </div>
              <p className="text-xs text-muted mt-1">
                Placed {formatTimeAgo(order.createdAt)}
                {order.customerName ? ` for ${order.customerName}` : ''}
                {order.tableNumber ? ` · Table #${order.tableNumber}` : ''}
              </p>
            </div>

            {/* Live SSE status indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  sseStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : sseStatus === 'connecting'
                    ? 'bg-amber-500'
                    : 'bg-stone-400'
                }`}
              />
              <span className="text-muted font-medium">
                {sseStatus === 'connected' ? 'Live Updates Active' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Ready Banner */}
          {order.status === 'READY' && (
            <div className="my-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold">Your order is Ready!</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {order.orderType === 'DINE_IN'
                    ? `Staff is bringing your dishes to Table #${order.tableNumber}.`
                    : 'Your takeaway parcel is ready at the counter.'}
                </p>
              </div>
            </div>
          )}

          {/* Status Timeline Stepper */}
          <div className="my-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
              Preparation Progress
            </h2>
            <div className="grid grid-cols-4 gap-2 relative">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.key} className="text-center flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCurrent
                          ? 'bg-primary text-white ring-4 ring-primary/20 scale-110 shadow-md'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-secondary text-muted'
                      }`}
                    >
                      {isPassed && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs mt-2 block font-semibold ${
                        isCurrent ? 'text-primary' : isPassed ? 'text-foreground' : 'text-muted'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items Summary */}
          <div className="pt-6 border-t border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              Items Ordered
            </h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1">
                  <div>
                    <span className="font-semibold text-foreground">{item.nameSnapshot}</span>
                    <span className="ml-2 text-xs font-medium text-muted bg-secondary px-2 py-0.5 rounded">
                      {item.variantLabelSnapshot} × {item.qty}
                    </span>
                  </div>
                  <span className="font-tabular font-semibold text-foreground">
                    {formatPaise(item.lineTotalPaise)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Amount Paid</span>
              <span className="text-xl font-bold font-tabular text-foreground">
                {formatPaise(order.totalPaise)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
