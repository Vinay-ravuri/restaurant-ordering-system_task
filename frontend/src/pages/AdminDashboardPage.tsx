import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, ShoppingBag, DollarSign, Clock, Check, X, AlertCircle } from 'lucide-react';
import { api } from '../lib/api.js';
import { formatPaise, formatTimeAgo } from '../lib/utils.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'menu'>('overview');

  // Query today's IST metrics
  const { data: metrics, isLoading: isMetricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['adminToday'],
    queryFn: async () => {
      return api.admin.getTodayMetrics();
    },
    refetchInterval: 30000,
  });

  // Query admin menu
  const { data: menuData, isLoading: isMenuLoading, refetch: refetchMenu } = useQuery({
    queryKey: ['adminMenu'],
    queryFn: async () => {
      const res = await api.admin.getMenu();
      return res.categories;
    },
    enabled: activeTab === 'menu',
  });

  // Mutation to toggle item availability
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      return api.admin.toggleAvailability(id, isAvailable);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMenu'] });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-bold font-serif text-foreground">Management Console</h1>
            <p className="text-xs text-muted mt-0.5">
              Live operational metrics for IST Date: <span className="font-semibold text-foreground">{metrics?.istDateString || 'Today'}</span>
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-secondary p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overview' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'
              }`}
            >
              Today's Overview
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'menu' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'
              }`}
            >
              Menu & Availability
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {activeTab === 'overview' ? (
          <div>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="bg-card rounded-2xl border border-border p-5 text-left shadow-soft">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-tabular text-foreground">
                  {formatPaise(metrics?.totalRevenuePaise || 0)}
                </div>
                <span className="text-[11px] text-muted mt-1 block">Asia/Kolkata Business Day</span>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5 text-left shadow-soft">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-tabular text-foreground">
                  {metrics?.orderCount || 0}
                </div>
                <span className="text-[11px] text-muted mt-1 block">
                  {metrics?.ordersByType?.DINE_IN || 0} Dine-in · {metrics?.ordersByType?.TAKEAWAY || 0} Takeaway
                </span>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5 text-left shadow-soft">
                <div className="flex items-center justify-between text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Avg Order Value</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-tabular text-foreground">
                  {formatPaise(metrics?.averageOrderValuePaise || 0)}
                </div>
                <span className="text-[11px] text-muted mt-1 block">Per completed transaction</span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="mt-8 bg-card rounded-2xl border border-border overflow-hidden shadow-soft text-left">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="text-base font-bold font-serif text-foreground">Today's Orders</h2>
                <Button variant="outline" size="sm" onClick={() => refetchMetrics()}>
                  Refresh
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/50 text-muted uppercase tracking-wider text-[11px] border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Customer / Table</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {metrics?.orders?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted">
                          No orders placed yet today.
                        </td>
                      </tr>
                    ) : (
                      metrics?.orders?.map((order) => (
                        <tr key={order.id} className="hover:bg-background/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-foreground font-serif">
                            {order.orderNumber || `#${order.id.slice(0, 5)}`}
                          </td>
                          <td className="py-3 px-4">
                            <Badge orderType={order.orderType} />
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">
                            {order.orderType === 'DINE_IN' ? `Table #${order.tableNumber}` : 'Takeaway'}
                            {order.customerName ? ` (${order.customerName})` : ''}
                          </td>
                          <td className="py-3 px-4 text-muted max-w-xs truncate">
                            {order.items.map((i) => `${i.qty}× ${i.nameSnapshot}`).join(', ')}
                          </td>
                          <td className="py-3 px-4">
                            <Badge status={order.status} />
                          </td>
                          <td className="py-3 px-4 text-right font-bold font-tabular text-foreground">
                            {formatPaise(order.totalPaise)}
                          </td>
                          <td className="py-3 px-4 text-right text-muted font-tabular">
                            {formatTimeAgo(order.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Menu & Availability Management */
          <div className="space-y-6 text-left">
            {menuData?.map((cat) => (
              <div key={cat.id} className="bg-card rounded-2xl border border-border p-5 shadow-soft">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                  <div>
                    <h3 className="text-base font-bold font-serif text-foreground">{cat.name}</h3>
                    {cat.description && <p className="text-xs text-muted">{cat.description}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cat.items?.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        item.isAvailable ? 'bg-background border-border' : 'bg-red-50/20 border-red-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{item.name}</span>
                          {!item.isAvailable && (
                            <span className="text-[10px] font-bold uppercase bg-red-100 text-danger px-1.5 py-0.5 rounded">
                              Out of Stock
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {item.variants.map((v) => (
                            <span
                              key={v.id}
                              className="text-[11px] font-medium bg-secondary px-2 py-0.5 rounded text-foreground font-tabular"
                            >
                              {v.label}: {formatPaise(v.pricePaise)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Availability Toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          toggleAvailabilityMutation.mutate({
                            id: item.id,
                            isAvailable: !item.isAvailable,
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 min-h-[38px] ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-800 border border-red-300 hover:bg-red-100'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Available</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 text-danger" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
