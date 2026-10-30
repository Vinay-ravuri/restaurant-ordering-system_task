import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, 
  CheckCircle2, 
  Utensils, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  ChefHat, 
  Sparkles,
  ShoppingBag,
  Flame,
  Check
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useEventSource } from '../hooks/useEventSource.js';
import { formatPaise, formatTimeAgo } from '../lib/utils.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { PAGE_BACKGROUNDS, getDishImageUrl } from '../lib/dishImages.js';
import type { OrderStatus } from '../types/index.js';

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; desc: string; icon: string }> = [
  { key: 'RECEIVED', label: 'Order Received', desc: 'Verified and queued in master kitchen', icon: '📝' },
  { key: 'PREPARING', label: 'In Kitchen Preparation', desc: 'Chefs actively firing & plating your order', icon: '🔥' },
  { key: 'READY', label: 'Ready for Service', desc: 'Plated hot, ready for table or pickup counter', icon: '🍽️' },
  { key: 'SERVED', label: 'Completed & Served', desc: 'Order delivered and ready to enjoy', icon: '✨' },
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center animate-spin mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif text-foreground">Loading Your Order Status...</h2>
        <p className="text-xs text-muted mt-1.5">Connecting to real-time dining stream</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-danger flex items-center justify-center mb-4 border border-red-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-foreground">Order Not Found</h2>
        <p className="text-xs text-muted mt-2 leading-relaxed">
          We could not locate this order receipt. Please check your link or browse our menu to place an order.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="primary" className="rounded-2xl">Return to Menu</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen pb-24">
      {/* Cinematic Hero Header with Food Background */}
      <section className="relative overflow-hidden bg-stone-950 text-white py-12 sm:py-16 px-4 sm:px-6 border-b border-stone-800">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-105"
          style={{ backgroundImage: `url(${PAGE_BACKGROUNDS.orderTrackingHero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-stone-950/50" />

        <div className="relative max-w-4xl mx-auto z-10 text-left">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-300 hover:text-white mb-4 transition-colors px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Menu</span>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                  Live Order Tracker
                </span>
                <span className="text-stone-500">·</span>
                <div className="flex items-center gap-1 text-xs text-stone-300">
                  <span className={`w-2 h-2 rounded-full ${sseStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{sseStatus === 'connected' ? 'Live Stream Connected' : 'Syncing...'}</span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1 tracking-tight">
                Order {order.orderNumber || `#${order.id.slice(0, 6).toUpperCase()}`}
              </h1>
              <p className="text-xs text-stone-300 mt-1">
                Placed {formatTimeAgo(order.createdAt)} · {order.orderType === 'DINE_IN' ? `Table ${order.tableNumber || '-'}` : 'Takeaway Order'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge status={order.status} className="text-sm py-1.5 px-3.5 rounded-xl shadow-soft" />
              <Badge orderType={order.orderType} className="text-sm py-1.5 px-3 rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Visual Progress Steps Tracker Card */}
        <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-soft text-left">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div>
              <h2 className="text-lg font-bold font-serif text-foreground">Preparation Timeline</h2>
              <p className="text-xs text-muted mt-0.5">Automated kitchen status synchronization</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-primary">Stage {currentStepIndex + 1} of 4</span>
            </div>
          </div>

          {/* Progress Bar & Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {STATUS_STEPS.map((step, index) => {
              const isDone = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`relative p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-primary-light/60 border-primary/40 shadow-sm'
                      : isDone
                      ? 'bg-secondary/60 border-border'
                      : 'bg-card/40 border-border/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{step.icon}</span>
                    {isDone ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-stone-300" />
                    )}
                  </div>
                  <h3 className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                    {step.label}
                  </h3>
                  <p className="text-[11px] text-muted mt-1 leading-normal">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Itemized Order Receipt Card */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-soft text-left">
          <div className="p-6 sm:p-8 border-b border-border bg-secondary/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                  Digital Guest Check
                </span>
                <h3 className="text-xl font-bold font-serif text-foreground mt-0.5">
                  Ordered Dishes & Items
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {order.customerName && (
                  <span className="text-xs font-medium text-foreground bg-card px-3 py-1 rounded-xl border border-border">
                    Guest: <span className="font-bold">{order.customerName}</span>
                  </span>
                )}
                {order.tableNumber && (
                  <span className="text-xs font-bold text-foreground bg-card px-3 py-1 rounded-xl border border-border">
                    Table #{order.tableNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="p-6 sm:p-8 divide-y divide-border">
            {order.items.map((line) => {
              const dishThumb = getDishImageUrl({ name: line.nameSnapshot });

              return (
                <div key={line.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={dishThumb}
                      alt={line.nameSnapshot}
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-border shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground leading-snug">
                          {line.nameSnapshot}
                        </span>
                        <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md">
                          ×{line.qty}
                        </span>
                      </div>
                      <div className="text-xs text-muted mt-0.5 flex items-center gap-2">
                        <span>{line.variantLabelSnapshot}</span>
                        <span>·</span>
                        <span className="font-tabular">{formatPaise(line.unitPricePaise)} each</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-tabular">
                    <span className="text-sm font-bold text-foreground">
                      {formatPaise(line.lineTotalPaise)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Summary Footer */}
          <div className="p-6 sm:p-8 bg-secondary/40 border-t border-border space-y-2">
            <div className="flex justify-between text-xs text-muted">
              <span>Item Subtotal</span>
              <span className="font-tabular text-foreground font-semibold">
                {formatPaise(order.totalPaise)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>Applicable GST / Taxes</span>
              <span className="text-emerald-700 font-medium">Included in Menu Price</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between items-baseline">
              <span className="text-base font-bold text-foreground font-serif">Total Bill Paid</span>
              <span className="text-2xl font-bold font-tabular text-foreground font-serif">
                {formatPaise(order.totalPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center pt-2">
          <Link to="/">
            <Button variant="outline" size="lg" className="rounded-2xl gap-2 font-bold shadow-soft">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>Browse Full Menu & Order More</span>
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
