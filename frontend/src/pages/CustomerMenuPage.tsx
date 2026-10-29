import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingBag, Plus, Minus, Check, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api.js';
import { useCart } from '../hooks/useCart.js';
import { useEventSource } from '../hooks/useEventSource.js';
import { formatPaise } from '../lib/utils.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import type { MenuItem, ItemVariant } from '../types/index.js';

export function CustomerMenuPage() {
  const { addItem, items: cartLines, totalItems, totalPaise, setIsDrawerOpen, evictItem } = useCart();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [outOfStockToast, setOutOfStockToast] = useState<string | null>(null);

  // Selected variant for each item on the page: { [itemId]: variantId }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Query menu
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await api.menu.getPublic();
      return res.categories;
    },
  });

  const categories = data || [];

  // Listen for real-time menu stock changes (Stretch Feature)
  useEventSource('/events/menu', {
    events: ['menu.updated'],
    onMessage: (event) => {
      refetch();
      if (event.data?.action === 'availability_changed' && !event.data.isAvailable) {
        const result = evictItem(event.data.itemId);
        if (result.evicted) {
          setOutOfStockToast(`"${result.itemName || 'An item'}" was marked out of stock and removed from your cart.`);
          setTimeout(() => setOutOfStockToast(null), 6000);
        }
      }
    },
    onReconnect: () => refetch(),
  });

  // Default initial variants when categories load
  useEffect(() => {
    if (categories.length > 0) {
      const initialMap: Record<string, string> = {};
      for (const cat of categories) {
        for (const item of cat.items || []) {
          if (item.variants && item.variants.length > 0 && !selectedVariants[item.id]) {
            initialMap[item.id] = item.variants[0].id;
          }
        }
      }
      setSelectedVariants((prev) => ({ ...initialMap, ...prev }));
    }
  }, [categories]);

  // Filter items
  const allItems = categories.flatMap((cat) =>
    (cat.items || []).map((item) => ({ ...item, categoryName: cat.name }))
  );

  const filteredItems = allItems.filter((item) => {
    const matchesCategory = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-28">
      {/* Toast Banner for Out of Stock notification */}
      {outOfStockToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-amber-500 text-white px-4 py-3 rounded-2xl shadow-elevated flex items-center gap-3 text-sm font-semibold animate-bounce">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{outOfStockToast}</span>
        </div>
      )}

      {/* Hero Banner */}
      <section className="bg-card border-b border-border py-8 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-primary uppercase font-sans">
            Crafted Regional Delicacies
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mt-1.5 tracking-tight">
            Authentic Flavors, Made to Order
          </h1>
          <p className="text-sm text-muted mt-2 max-w-xl mx-auto">
            Choose your favorites, customize portion sizes, and track your freshly cooked order in real-time.
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dishes, curries, biryani..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted/60 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Sticky Category Tabs */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none min-h-[38px] ${
              selectedCategoryId === 'all'
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-card text-muted hover:text-foreground border border-border'
            }`}
          >
            All Dishes ({allItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none min-h-[38px] ${
                selectedCategoryId === cat.id
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-card text-muted hover:text-foreground border border-border'
              }`}
            >
              {cat.name} ({cat.items?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-card rounded-2xl border border-border p-5 animate-pulse space-y-3">
                <div className="w-1/3 h-4 bg-secondary rounded" />
                <div className="w-2/3 h-5 bg-secondary rounded" />
                <div className="w-full h-12 bg-secondary rounded" />
                <div className="w-full h-10 bg-secondary rounded-xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-muted bg-card rounded-2xl border border-border">
            <p className="text-base font-semibold text-danger">Failed to load restaurant menu</p>
            <p className="text-xs text-muted mt-1">Please ensure the backend server and database are running.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-muted bg-card rounded-2xl border border-border">
            <p className="text-base font-semibold text-foreground">No matching dishes found</p>
            <p className="text-xs text-muted mt-1">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const activeVariantId = selectedVariants[item.id] || item.variants[0]?.id;
              const activeVariant = item.variants.find((v) => v.id === activeVariantId) || item.variants[0];
              const cartItem = cartLines.find((c) => c.variantId === activeVariant?.id);

              return (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between hover:shadow-card transition-all duration-200 text-left"
                >
                  <div>
                    {/* Header: Dietary & Category */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge dietary={item.dietary} />
                      <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                        {item.categoryName}
                      </span>
                    </div>

                    {/* Name & Description */}
                    <h3 className="text-base font-bold text-foreground leading-snug">{item.name}</h3>
                    <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border">
                    {/* Variant Selector (Half / Full / Regular) */}
                    {item.variants.length > 1 ? (
                      <div className="mb-3">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                          Select Portion
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary rounded-xl">
                          {item.variants.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariants((prev) => ({ ...prev, [item.id]: v.id }))}
                              className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-all ${
                                activeVariant?.id === v.id
                                  ? 'bg-card text-foreground shadow-sm font-bold'
                                  : 'text-muted hover:text-foreground'
                              }`}
                            >
                              <span>{v.label}</span>
                              <span className="font-tabular text-[11px]">{formatPaise(v.pricePaise)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 flex items-baseline justify-between">
                        <span className="text-xs font-medium text-muted">Price</span>
                        <span className="text-base font-bold font-tabular text-foreground">
                          {formatPaise(activeVariant?.pricePaise || 0)}
                        </span>
                      </div>
                    )}

                    {/* Add to Cart / Quantity Stepper */}
                    {cartItem ? (
                      <div className="flex items-center justify-between bg-primary-light border border-primary/20 rounded-xl p-1.5">
                        <span className="text-xs font-bold text-primary px-2">Added to Cart</span>
                        <div className="flex items-center gap-1.5 bg-white rounded-lg p-0.5 shadow-sm">
                          <button
                            onClick={() => addItem(activeVariant, item, -1)}
                            className="w-7 h-7 flex items-center justify-center text-muted hover:text-danger rounded transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-tabular text-foreground">
                            {cartItem.qty}
                          </span>
                          <button
                            onClick={() => addItem(activeVariant, item, 1)}
                            disabled={cartItem.qty >= 20}
                            className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground rounded transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        fullWidth
                        size="md"
                        disabled={!item.isAvailable || !activeVariant?.isAvailable}
                        onClick={() => {
                          if (activeVariant) {
                            addItem(activeVariant, item, 1);
                          }
                        }}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add to Order · {formatPaise(activeVariant?.pricePaise || 0)}</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile Sticky Bottom "View Cart · ₹total" Bar */}
      {totalItems() > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border p-3 sm:hidden shadow-elevated">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold flex items-center justify-between shadow active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{totalItems()} {totalItems() === 1 ? 'item' : 'items'} in cart</span>
            </div>
            <div className="flex items-center gap-1 font-tabular">
              <span>View Cart</span>
              <span>·</span>
              <span className="text-base">{formatPaise(totalPaise())}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
