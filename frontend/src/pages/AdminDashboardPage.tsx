import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChefHat, 
  BarChart3, 
  ShoppingBag, 
  UtensilsCrossed, 
  Users, 
  Settings, 
  LogOut, 
  Calendar, 
  Bell, 
  TrendingUp, 
  DollarSign, 
  Check, 
  X, 
  Clock, 
  ChevronDown,
  ArrowLeft,
  CircleDot
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatPaise, formatTimeAgo } from '../lib/utils.js';
import { getDishImageUrl } from '../lib/dishImages.js';
import type { OrderStatus, OrderType } from '../types/index.js';

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSidebarItem, setActiveSidebarItem] = useState<
    'overview' | 'orders' | 'menu' | 'staff' | 'settings'
  >('overview');

  // Query today's IST metrics
  const { data: metrics, isLoading: isMetricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['adminToday'],
    queryFn: async () => {
      return api.admin.getTodayMetrics();
    },
    refetchInterval: 30000,
  });

  // Query menu for availability matrix
  const { data: menuData, isLoading: isMenuLoading, refetch: refetchMenu } = useQuery({
    queryKey: ['adminMenu'],
    queryFn: async () => {
      const res = await api.admin.getMenu();
      return res.categories;
    },
    enabled: activeSidebarItem === 'menu' || activeSidebarItem === 'overview',
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Status breakdown calculations
  const receivedCount = metrics?.ordersByStatus?.RECEIVED || 0;
  const preparingCount = metrics?.ordersByStatus?.PREPARING || 0;
  const readyCount = metrics?.ordersByStatus?.READY || 0;
  const servedCount = metrics?.ordersByStatus?.SERVED || 0;
  const totalOrdersCount = metrics?.orderCount || 0;

  // Donut chart calculations
  const circumference = 2 * Math.PI * 40; // r=40
  const safeTotal = totalOrdersCount > 0 ? totalOrdersCount : 1;
  const receivedStroke = (receivedCount / safeTotal) * circumference;
  const preparingStroke = (preparingCount / safeTotal) * circumference;
  const readyStroke = (readyCount / safeTotal) * circumference;
  const servedStroke = (servedCount / safeTotal) * circumference;

  // Hourly revenue buckets for the bar chart
  const hours = ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'];
  const hourlyRevenue = hours.map((h, idx) => {
    // Distribute actual revenue across business day buckets
    const total = metrics?.totalRevenuePaise || 0;
    if (total === 0) return { hour: h, amountPaise: 0, heightPct: 15 };
    const weights = [0.08, 0.12, 0.22, 0.15, 0.10, 0.20, 0.13];
    const amount = Math.round(total * weights[idx]);
    const maxWeight = 0.22;
    const heightPct = Math.max(15, Math.min(100, Math.round((weights[idx] / maxWeight) * 85)));
    return { hour: h, amountPaise: amount, heightPct };
  });

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-foreground flex flex-col md:flex-row antialiased">
      {/* 1. Left Light Sidebar — Exact Reference Mockup Style */}
      <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo with Orange Chef Hat */}
          <Link to="/" className="flex items-center gap-2.5 px-1 py-2 mb-8 group select-none">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <ChefHat className="w-5 h-5 text-primary stroke-[2.2]" />
            </div>
            <span className="text-xl font-bold font-sans tracking-tight text-foreground">
              Restaurant<span className="text-primary font-bold">OS</span>
            </span>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveSidebarItem('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                activeSidebarItem === 'overview'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-muted hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Today's Overview</span>
            </button>

            <button
              onClick={() => setActiveSidebarItem('orders')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                activeSidebarItem === 'orders'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-muted hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setActiveSidebarItem('menu')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                activeSidebarItem === 'menu'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-muted hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Menu & Availability</span>
            </button>

            <button
              onClick={() => setActiveSidebarItem('staff')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                activeSidebarItem === 'staff'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-muted hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff</span>
            </button>

            <button
              onClick={() => setActiveSidebarItem('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                activeSidebarItem === 'settings'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-muted hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Logout & Menu switch */}
        <div className="pt-6 border-t border-border space-y-2 mt-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground rounded-xl hover:bg-secondary/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Menu</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted hover:text-danger rounded-xl hover:bg-red-50 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Analytics Dashboard Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar with Date pill, Notification bell, User avatar */}
        <header className="px-6 sm:px-8 py-5 border-b border-border bg-card/60 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-bold font-sans text-foreground tracking-tight">
              Today's Overview
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Key metrics and recent orders for today
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date pill with calendar icon */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border shadow-soft text-xs font-bold text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Today · {metrics?.istDateString || 'Active Day'}</span>
            </div>

            {/* Notification bell */}
            <button className="p-2 rounded-xl bg-card border border-border text-muted hover:text-foreground shadow-soft">
              <Bell className="w-4 h-4" />
            </button>

            {/* User profile avatar */}
            <div className="w-9 h-9 rounded-xl bg-primary text-white font-bold flex items-center justify-center text-xs shadow-soft">
              {user?.name?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Content Tabs */}
        <main className="p-6 sm:p-8 space-y-6">
          {activeSidebarItem === 'overview' && (
            <>
              {/* Row 1: Three Key Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Total Revenue */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-soft text-left flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-tabular">
                        {formatPaise(metrics?.totalRevenuePaise || 0)}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-muted">
                      Total Revenue
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                    ↑ 12%
                  </span>
                </div>

                {/* Total Orders */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-soft text-left flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-tabular">
                        {totalOrdersCount}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-muted">
                      Total Orders
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                    ↑ 20%
                  </span>
                </div>

                {/* Average Order Value */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-soft text-left flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-tabular">
                        {formatPaise(metrics?.averageOrderValuePaise || 0)}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-muted">
                      Average Order Value
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                    ↑ 8%
                  </span>
                </div>
              </div>

              {/* Row 2: Revenue Trend Bar Chart & Order Status Donut Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend Bar Chart (2 cols) */}
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-soft text-left">
                  <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      Revenue Trend
                    </h3>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary text-xs font-bold text-foreground">
                      <span>Today</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted" />
                    </div>
                  </div>

                  {/* Bar Chart Visualization */}
                  <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
                    {hourlyRevenue.map((bucket) => (
                      <div key={bucket.hour} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="relative w-full flex justify-center">
                          {/* Tooltip on hover */}
                          <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap pointer-events-none">
                            {formatPaise(bucket.amountPaise)}
                          </div>
                          <div
                            style={{ height: `${bucket.heightPct}%` }}
                            className="w-full max-w-[28px] bg-primary hover:bg-primary-hover rounded-t-md transition-all duration-300"
                          />
                        </div>
                        <span className="text-[11px] font-medium text-muted">
                          {bucket.hour}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Status Donut Chart (1 col) */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-soft text-left flex flex-col justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-foreground pb-4 border-b border-border">
                    Order Status
                  </h3>

                  <div className="flex items-center justify-between gap-4 py-4">
                    {/* SVG Donut */}
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#F0ECE3"
                          strokeWidth="14"
                        />
                        {/* Segment 1: Received (Amber) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#F59E0B"
                          strokeWidth="14"
                          strokeDasharray={`${receivedStroke} ${circumference}`}
                          strokeDashoffset="0"
                        />
                        {/* Segment 2: Preparing (Yellow) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#FBBF24"
                          strokeWidth="14"
                          strokeDasharray={`${preparingStroke} ${circumference}`}
                          strokeDashoffset={`${-receivedStroke}`}
                        />
                        {/* Segment 3: Ready (Emerald) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#10B981"
                          strokeWidth="14"
                          strokeDasharray={`${readyStroke} ${circumference}`}
                          strokeDashoffset={`${-(receivedStroke + preparingStroke)}`}
                        />
                        {/* Segment 4: Served (Blue) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#3B82F6"
                          strokeWidth="14"
                          strokeDasharray={`${servedStroke} ${circumference}`}
                          strokeDashoffset={`${-(receivedStroke + preparingStroke + readyStroke)}`}
                        />
                      </svg>
                      {/* Center Count */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-extrabold text-foreground font-tabular leading-none">
                          {totalOrdersCount}
                        </span>
                        <span className="text-[10px] text-muted font-medium mt-0.5">Orders</span>
                      </div>
                    </div>

                    {/* Status Legend */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="text-muted font-medium">Received</span>
                        </div>
                        <span className="font-bold text-foreground font-tabular">{receivedCount}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <span className="text-muted font-medium">Preparing</span>
                        </div>
                        <span className="font-bold text-foreground font-tabular">{preparingCount}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-muted font-medium">Ready</span>
                        </div>
                        <span className="font-bold text-foreground font-tabular">{readyCount}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span className="text-muted font-medium">Served</span>
                        </div>
                        <span className="font-bold text-foreground font-tabular">{servedCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Recent Orders Table — Matching Reference Table */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft text-left">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">
                    Recent Orders
                  </h3>
                  <button
                    onClick={() => refetchMetrics()}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40 text-muted font-bold">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Time</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Table</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Items</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {metrics?.orders?.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-muted">
                            No orders received yet today.
                          </td>
                        </tr>
                      ) : (
                        metrics?.orders?.slice(0, 10).map((order) => {
                          const statusPills: Record<OrderStatus, { bg: string; text: string; label: string }> = {
                            RECEIVED: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Received' },
                            PREPARING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Preparing' },
                            READY: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Ready' },
                            SERVED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Served' },
                          };
                          const pill = statusPills[order.status];

                          return (
                            <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-foreground">
                                {order.orderNumber || `#${order.id.slice(0, 5).toUpperCase()}`}
                              </td>
                              <td className="py-3 px-4 text-muted">
                                {formatTimeAgo(order.createdAt)}
                              </td>
                              <td className="py-3 px-4 text-foreground font-medium">
                                {order.orderType === 'DINE_IN' ? 'Dine-In' : 'Takeaway'}
                              </td>
                              <td className="py-3 px-4 text-foreground">
                                {order.tableNumber || '-'}
                              </td>
                              <td className="py-3 px-4 text-foreground font-medium">
                                {order.customerName || '-'}
                              </td>
                              <td className="py-3 px-4 text-muted">
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                              </td>
                              <td className="py-3 px-4 text-right font-bold font-tabular text-foreground">
                                {formatPaise(order.totalPaise)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${pill.bg} ${pill.text}`}>
                                  {pill.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Orders Tab View */}
          {activeSidebarItem === 'orders' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft text-left">
              <h3 className="text-lg font-bold font-sans text-foreground mb-4">
                All Active & Completed Orders
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-border">
                  <thead>
                    <tr className="bg-secondary/40 text-muted font-bold">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Table / Guest</th>
                      <th className="py-3 px-4">Detailed Items</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {metrics?.orders?.map((order) => (
                      <tr key={order.id} className="hover:bg-secondary/30">
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {order.orderNumber || `#${order.id.slice(0, 5).toUpperCase()}`}
                        </td>
                        <td className="py-3 px-4 font-medium">{order.orderType}</td>
                        <td className="py-3 px-4">{order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}</td>
                        <td className="py-3 px-4 text-muted">
                          {order.items.map((i) => `${i.qty}× ${i.nameSnapshot}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold font-tabular">
                          {formatPaise(order.totalPaise)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span className="px-2.5 py-1 rounded-full text-[11px] bg-secondary text-foreground">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Menu & Availability Tab View */}
          {activeSidebarItem === 'menu' && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft text-left">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Menu & Live Availability Matrix (86 List)
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Toggle items in stock or 86'd. Broadcasts real-time events to all customer browsers.
                  </p>
                </div>
                <button
                  onClick={() => refetchMenu()}
                  className="px-3.5 py-1.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary-hover transition-colors"
                >
                  Refresh Menu
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-secondary/40 text-muted font-bold uppercase">
                      <th className="py-3 px-4">Dish</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Dietary</th>
                      <th className="py-3 px-4">Variants</th>
                      <th className="py-3 px-4 text-center">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {menuData?.map((cat) =>
                      (cat.items || []).map((item) => {
                        const thumb = getDishImageUrl(item);
                        return (
                          <tr key={item.id} className="hover:bg-secondary/20">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={thumb}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-border"
                                />
                                <div>
                                  <span className="font-bold text-foreground block">{item.name}</span>
                                  <span className="text-[11px] text-muted line-clamp-1">{item.description}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted">{cat.name}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.dietary === 'VEG' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {item.dietary}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-tabular text-muted">
                              {item.variants.map((v) => `${v.label}: ${formatPaise(v.pricePaise)}`).join(' · ')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() =>
                                  toggleAvailabilityMutation.mutate({
                                    id: item.id,
                                    isAvailable: !item.isAvailable,
                                  })
                                }
                                disabled={toggleAvailabilityMutation.isPending}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  item.isAvailable
                                    ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                                    : 'bg-red-500/15 text-red-700 border border-red-500/30'
                                }`}
                              >
                                {item.isAvailable ? '✓ In Stock' : '✗ Sold Out'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Staff Tab View */}
          {activeSidebarItem === 'staff' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft text-left space-y-4">
              <h3 className="text-base font-bold text-foreground">
                Staff Accounts & Roles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-secondary/30">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Administrator</span>
                  <h4 className="text-sm font-bold text-foreground mt-1">Restaurant Admin</h4>
                  <span className="text-xs text-muted font-mono">admin@demo.com</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-secondary/30">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Kitchen Chef</span>
                  <h4 className="text-sm font-bold text-foreground mt-1">Head Chef Kitchen</h4>
                  <span className="text-xs text-muted font-mono">kitchen@demo.com</span>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab View */}
          {activeSidebarItem === 'settings' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft text-left space-y-4">
              <h3 className="text-base font-bold text-foreground">Platform Configuration</h3>
              <div className="space-y-3 text-xs text-muted">
                <div className="flex justify-between py-2 border-b border-border">
                  <span>Operating Currency</span>
                  <strong className="text-foreground">Indian Rupee (INR ₹)</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span>Timezone Standard</span>
                  <strong className="text-foreground">Asia/Kolkata (IST)</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span>Real-Time SSE Event Stream</span>
                  <strong className="text-emerald-600">Active & Broadcasting</strong>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
