import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  Radio, 
  Wifi, 
  Check, 
  Layers, 
  ArrowLeft,
  UtensilsCrossed,
  ListOrdered
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useEventSource } from '../hooks/useEventSource.js';
import { formatTimeAgo, getElapsedMinutes, playAlertBeep } from '../lib/utils.js';
import type { Order, OrderStatus } from '../types/index.js';

interface ColumnConfig {
  status: OrderStatus;
  label: string;
  headerBg: string;
  headerText: string;
  actionLabel: string;
  actionBg: string;
  actionText: string;
  nextStatus: OrderStatus | null;
}

const KITCHEN_COLUMNS: ColumnConfig[] = [
  {
    status: 'RECEIVED',
    label: 'Received',
    headerBg: 'bg-stone-200',
    headerText: 'text-stone-800',
    actionLabel: 'Start Preparing',
    actionBg: 'bg-primary hover:bg-primary-hover text-white',
    actionText: 'text-white',
    nextStatus: 'PREPARING',
  },
  {
    status: 'PREPARING',
    label: 'Preparing',
    headerBg: 'bg-amber-100',
    headerText: 'text-amber-900',
    actionLabel: 'Mark Ready',
    actionBg: 'bg-amber-300 hover:bg-amber-400 text-stone-900',
    actionText: 'text-stone-900',
    nextStatus: 'READY',
  },
  {
    status: 'READY',
    label: 'Ready',
    headerBg: 'bg-emerald-100',
    headerText: 'text-emerald-900',
    actionLabel: 'Mark Served',
    actionBg: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    actionText: 'text-white',
    nextStatus: 'SERVED',
  },
  {
    status: 'SERVED',
    label: 'Served',
    headerBg: 'bg-blue-100',
    headerText: 'text-blue-900',
    actionLabel: 'Served',
    actionBg: 'bg-stone-100 text-stone-500 cursor-default',
    actionText: 'text-stone-500',
    nextStatus: null,
  },
];

export function KitchenPage() {
  const queryClient = useQueryClient();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'kds' | 'live'>('kds');

  // Query kitchen orders
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['kitchenOrders'],
    queryFn: async () => {
      const res = await api.kitchen.getOrders();
      return res.orders;
    },
    refetchInterval: 30000,
  });

  const orders = data || [];

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: OrderStatus }) => {
      return api.orders.updateStatus(id, nextStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
    },
  });

  // SSE real-time stream
  const { status: sseStatus } = useEventSource('/events/kitchen', {
    events: ['order.created', 'order.updated'],
    onMessage: (event) => {
      refetch();
      if (soundEnabled && event.type === 'order.created') {
        playAlertBeep();
      }
    },
    onReconnect: () => refetch(),
  });

  // 15-second tick for elapsed times
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#14161B] text-stone-100 flex flex-col md:flex-row antialiased">
      {/* 1. Left Dark Sidebar — Exact Reference Style */}
      <aside className="w-full md:w-64 bg-[#1A1C22] border-b md:border-b-0 md:border-r border-[#272A34] p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo with Chef Hat */}
          <div className="flex items-center gap-2.5 px-2 py-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-white">
              <ChefHat className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <span className="text-xl font-bold font-sans tracking-tight text-white">
              Restaurant<span className="text-primary font-bold">OS</span>
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveSidebarTab('kds')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeSidebarTab === 'kds'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Kitchen Display</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('live')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeSidebarTab === 'live'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Live Orders ({orders.length})</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Audio toggle & Return to Customer Menu */}
        <div className="pt-6 border-t border-[#272A34] space-y-2 mt-4">
          <button
            onClick={() => {
              if (!soundEnabled) playAlertBeep();
              setSoundEnabled(!soundEnabled);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Chime Alert</span>
            </span>
            <span className="text-[10px] font-bold uppercase">{soundEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-400 hover:text-white rounded-xl hover:bg-stone-800/50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Menu</span>
          </Link>
        </div>
      </aside>

      {/* 2. Main Kitchen Kanban Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="px-6 py-5 border-b border-[#272A34] flex flex-wrap items-center justify-between gap-4 bg-[#14161B]">
          <div className="text-left">
            <h1 className="text-2xl font-bold font-sans text-white tracking-tight">
              Kitchen Display
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Manage and update order status in real time
            </p>
          </div>

          {/* Right Live Status Pill with Wifi / Signal Icon */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1C22] border border-[#272A34] text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${sseStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-white font-medium">Live</span>
              <Wifi className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
            </div>
          </div>
        </header>

        {/* 4 Status Columns Kanban Board */}
        <main className="flex-1 p-6 overflow-x-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-[#1A1C22] rounded-2xl p-4 h-96 animate-pulse border border-[#272A34]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 min-w-[850px] lg:min-w-0">
              {KITCHEN_COLUMNS.map((col) => {
                const columnOrders = orders.filter((o) => o.status === col.status);

                return (
                  <div
                    key={col.status}
                    className="flex flex-col bg-[#1A1C22]/80 rounded-2xl border border-[#272A34] overflow-hidden"
                  >
                    {/* Status Column Header matching reference colors */}
                    <div className={`py-2.5 px-4 rounded-t-xl font-bold text-xs flex items-center justify-between ${col.headerBg} ${col.headerText}`}>
                      <span>
                        {col.label} ({columnOrders.length})
                      </span>
                    </div>

                    {/* Column Ticket Cards */}
                    <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto max-h-[calc(100vh-14rem)] no-scrollbar">
                      {columnOrders.length === 0 ? (
                        <div className="py-16 text-center text-stone-500 text-xs font-medium">
                          No orders
                        </div>
                      ) : (
                        columnOrders.map((order) => {
                          const elapsedMins = getElapsedMinutes(order.createdAt);
                          const isOverdue = elapsedMins > 15;

                          return (
                            <div
                              key={order.id}
                              className={`bg-white text-stone-900 rounded-xl p-4 shadow-sm border transition-all text-left ${
                                isOverdue ? 'ring-2 ring-red-500/80 animate-pulse' : 'border-stone-200'
                              }`}
                            >
                              {/* Top Row: #OrderNumber and Elapsed Time */}
                              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-stone-100">
                                <span className="font-extrabold text-stone-950 font-mono text-sm">
                                  {order.orderNumber || `#${order.id.slice(0, 5).toUpperCase()}`}
                                </span>
                                <span className="text-[11px] font-medium text-stone-500">
                                  {formatTimeAgo(order.createdAt)}
                                </span>
                              </div>

                              {/* Dining Info: Table / Takeaway */}
                              <div className="mt-2 text-xs font-bold text-stone-800">
                                {order.orderType === 'DINE_IN' ? (
                                  <span>Table {order.tableNumber || '-'} • Dine-in</span>
                                ) : (
                                  <span>Takeaway</span>
                                )}
                                {order.customerName && (
                                  <span className="font-normal text-stone-500"> ({order.customerName})</span>
                                )}
                              </div>

                              {/* Ordered Items List */}
                              <div className="mt-3 space-y-1.5 py-1 text-xs text-stone-700">
                                {order.items.map((line) => (
                                  <div key={line.id} className="flex items-start justify-between gap-1 leading-snug">
                                    <span className="font-medium">
                                      {line.qty} × {line.nameSnapshot} {line.variantLabelSnapshot ? `(${line.variantLabelSnapshot})` : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Action Button at Bottom of Card */}
                              <div className="mt-4 pt-2">
                                {col.nextStatus ? (
                                  <button
                                    onClick={() =>
                                      statusMutation.mutate({
                                        id: order.id,
                                        nextStatus: col.nextStatus as OrderStatus,
                                      })
                                    }
                                    disabled={statusMutation.isPending}
                                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-center transition-all shadow-xs cursor-pointer ${col.actionBg}`}
                                  >
                                    {col.actionLabel}
                                  </button>
                                ) : (
                                  <div className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-center bg-stone-100 text-stone-500">
                                    ✓ Served
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
