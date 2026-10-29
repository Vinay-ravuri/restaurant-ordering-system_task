import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChefHat, Clock, Volume2, VolumeX, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api.js';
import { useEventSource } from '../hooks/useEventSource.js';
import { formatTimeAgo, getElapsedMinutes, playAlertBeep } from '../lib/utils.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import type { Order, OrderStatus } from '../types/index.js';

const COLUMNS: Array<{ status: OrderStatus; label: string; actionLabel: string; nextStatus: OrderStatus | null }> = [
  { status: 'RECEIVED', label: 'Received', actionLabel: 'Start Preparing', nextStatus: 'PREPARING' },
  { status: 'PREPARING', label: 'Preparing', actionLabel: 'Mark Ready', nextStatus: 'READY' },
  { status: 'READY', label: 'Ready for Pickup', actionLabel: 'Mark Served', nextStatus: 'SERVED' },
  { status: 'SERVED', label: 'Recently Served', actionLabel: '', nextStatus: null },
];

export function KitchenPage() {
  const queryClient = useQueryClient();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<OrderStatus>('RECEIVED');

  // Query active kitchen orders
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['kitchenOrders'],
    queryFn: async () => {
      const res = await api.kitchen.getOrders();
      return res.orders;
    },
    refetchInterval: 30000, // Background refresh every 30s
  });

  const orders = data || [];

  // Mutation to advance order status
  const statusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: OrderStatus }) => {
      return api.orders.updateStatus(id, nextStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
    },
  });

  // Real-time SSE connection for kitchen updates
  const { status: sseStatus } = useEventSource('/events/kitchen', {
    events: ['order.created', 'order.updated'],
    onMessage: (event) => {
      refetch();
      if (soundEnabled && event.type === 'order.created') {
        playAlertBeep();
      }
    },
    onReconnect: () => {
      refetch();
    },
  });

  // Re-render elapsed timers every 15 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Kitchen Header */}
      <div className="bg-card border-b border-border py-4 px-4 sticky top-16 z-30 shadow-soft">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold">
              <ChefHat className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold font-serif text-foreground leading-tight">
                Kitchen Display System (KDS)
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    sseStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className="text-muted font-medium">
                  {sseStatus === 'connected' ? 'Live Stream Active' : 'Connecting to Server...'}
                </span>
                <span className="text-muted">·</span>
                <span className="text-muted font-medium font-tabular">{orders.length} Total Orders</span>
              </div>
            </div>
          </div>

          {/* Sound Notification Toggle */}
          <button
            onClick={() => {
              if (!soundEnabled) {
                playAlertBeep(); // Test chime when enabling
              }
              setSoundEnabled(!soundEnabled);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-card border-border text-muted hover:text-foreground'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Audio Chime Enabled' : 'Enable Chime'}</span>
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className="flex sm:hidden gap-1 mt-3 border-t border-border pt-2">
          {COLUMNS.map((col) => {
            const count = orders.filter((o) => o.status === col.status).length;
            return (
              <button
                key={col.status}
                onClick={() => setActiveMobileTab(col.status)}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeMobileTab === col.status ? 'bg-foreground text-background' : 'text-muted'
                }`}
              >
                <span>{col.label.split(' ')[0]}</span>
                <span className="text-[10px] bg-secondary px-1.5 py-0.2 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Columns Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            const isTabActiveMobile = activeMobileTab === col.status;

            return (
              <div
                key={col.status}
                className={`flex flex-col bg-card/60 backdrop-blur rounded-2xl border border-border p-3.5 min-h-[500px] ${
                  !isTabActiveMobile ? 'hidden sm:flex' : 'flex'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{col.label}</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-bold font-tabular text-foreground">
                      {colOrders.length}
                    </span>
                  </div>
                </div>

                {/* Orders List in Column */}
                <div className="space-y-3.5 flex-1 overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center text-muted">
                      <p className="text-xs">No orders in this state</p>
                    </div>
                  ) : (
                    colOrders.map((order) => {
                      const elapsedMin = getElapsedMinutes(order.createdAt);
                      const isOverdue = elapsedMin >= 15 && order.status !== 'SERVED';

                      return (
                        <div
                          key={order.id}
                          className={`bg-card rounded-2xl border p-4 text-left transition-all shadow-sm ${
                            isOverdue
                              ? 'border-danger/80 ring-2 ring-danger/20 animate-pulse-subtle bg-red-50/20'
                              : 'border-border hover:shadow-card'
                          }`}
                        >
                          {/* Order Header */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border">
                            <div>
                              <span className="text-base font-extrabold font-serif text-foreground block leading-tight">
                                {order.orderNumber || `#${order.id.slice(0, 5)}`}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge orderType={order.orderType} />
                                {order.tableNumber && (
                                  <span className="text-xs font-bold text-foreground">
                                    T#{order.tableNumber}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Elapsed Time Badge */}
                            <div className="text-right">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold font-tabular px-2 py-0.5 rounded-md ${
                                  isOverdue ? 'bg-danger text-white' : 'bg-secondary text-muted'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {Math.floor(elapsedMin)}m
                              </span>
                              {isOverdue && (
                                <span className="block text-[10px] font-bold text-danger uppercase mt-0.5">
                                  Overdue &gt;15m
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Items Breakdown */}
                          <div className="py-3 space-y-1.5">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start justify-between text-xs font-medium text-foreground"
                              >
                                <span className="leading-tight">
                                  <span className="font-bold font-tabular mr-1 text-primary">
                                    {item.qty}×
                                  </span>
                                  {item.nameSnapshot}
                                </span>
                                <span className="text-[11px] text-muted bg-secondary px-1.5 py-0.2 rounded shrink-0 ml-1">
                                  {item.variantLabelSnapshot}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Action Button */}
                          {col.nextStatus && (
                            <div className="pt-2 border-t border-border mt-1">
                              <Button
                                variant="primary"
                                fullWidth
                                size="sm"
                                isLoading={statusMutation.isPending}
                                onClick={() =>
                                  statusMutation.mutate({
                                    id: order.id,
                                    nextStatus: col.nextStatus!,
                                  })
                                }
                                className="gap-1.5 text-xs font-bold"
                              >
                                <span>{col.actionLabel}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
