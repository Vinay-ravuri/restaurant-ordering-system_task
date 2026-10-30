import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Check, 
  AlertTriangle, 
  ArrowRight,
  Flame, 
  UtensilsCrossed, 
  Layers, 
  Sparkles, 
  Coffee,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useCart } from '../hooks/useCart.js';
import { useEventSource } from '../hooks/useEventSource.js';
import { formatPaise } from '../lib/utils.js';
import { PAGE_BACKGROUNDS, getDishImageUrl } from '../lib/dishImages.js';
import type { MenuItem, ItemVariant } from '../types/index.js';

export function CustomerMenuPage() {
  const { addItem, items: cartLines, totalItems, totalPaise, setIsDrawerOpen, evictItem } = useCart();
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const [outOfStockToast, setOutOfStockToast] = useState<string | null>(null);

  // Selected variant for each item on the page: { [itemId]: variantId }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  // Local quantity selection for items before adding to cart: { [itemId]: number }
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const menuSectionRef = useRef<HTMLDivElement>(null);

  // Query menu
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await api.menu.getPublic();
      return res.categories;
    },
  });

  const categories = data || [];

  // Real-time menu stock listener
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

  // Default initial variants and quantities when categories load
  useEffect(() => {
    if (categories.length > 0) {
      const initialMap: Record<string, string> = {};
      const initialQty: Record<string, number> = {};
      for (const cat of categories) {
        for (const item of cat.items || []) {
          if (item.variants && item.variants.length > 0 && !selectedVariants[item.id]) {
            initialMap[item.id] = item.variants[0].id;
          }
          if (!itemQuantities[item.id]) {
            initialQty[item.id] = 1;
          }
        }
      }
      setSelectedVariants((prev) => ({ ...initialMap, ...prev }));
      setItemQuantities((prev) => ({ ...initialQty, ...prev }));
    }
  }, [categories]);

  // Flatten all items with category info
  const allItems = categories.flatMap((cat) =>
    (cat.items || []).map((item) => ({ ...item, categoryName: cat.name }))
  );

  // Category mapping matching reference image categories:
  // All items | Starters | Main Course | Breads | Rice & Biryani | Desserts
  const categoryFilters = [
    { key: 'all', label: 'All items', icon: LayoutGrid },
    { key: 'starters', label: 'Starters', icon: Flame, matchStr: ['starter', 'appetizer'] },
    { key: 'main_course', label: 'Main Course', icon: UtensilsCrossed, matchStr: ['curries', 'gravies', 'main course'] },
    { key: 'breads', label: 'Breads', icon: Layers, matchStr: ['breads', 'naan', 'roti'] },
    { key: 'biryani', label: 'Rice & Biryani', icon: Sparkles, matchStr: ['biryani', 'rice'] },
    { key: 'desserts', label: 'Desserts', icon: Coffee, matchStr: ['desserts', 'drinks', 'sweets'] },
  ];

  // Filter items
  let filteredItems = allItems.filter((item) => {
    let matchesCategory = true;
    if (selectedCategoryKey !== 'all') {
      const activeFilter = categoryFilters.find((c) => c.key === selectedCategoryKey);
      if (activeFilter?.matchStr) {
        const catNameLower = item.categoryName.toLowerCase();
        matchesCategory = activeFilter.matchStr.some((s) => catNameLower.includes(s));
      }
    }

    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Sorting
  filteredItems = [...filteredItems].sort((a, b) => {
    const priceA = a.variants[0]?.pricePaise || 0;
    const priceB = b.variants[0]?.pricePaise || 0;
    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const scrollToMenu = () => {
    menuSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateItemLocalQty = (itemId: string, delta: number) => {
    setItemQuantities((prev) => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, Math.min(20, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Toast Banner for Out of Stock notification */}
      {outOfStockToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-primary text-white px-4 py-3 rounded-2xl shadow-elevated flex items-center gap-3 text-sm font-semibold animate-bounce">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{outOfStockToast}</span>
        </div>
      )}

      {/* 1. Cinematic Hero Section — Exact Reference Layout */}
      <section className="relative overflow-hidden bg-stone-950 text-white min-h-[480px] sm:min-h-[560px] flex items-center justify-start px-6 sm:px-12 lg:px-20">
        {/* Full-width food photography background with warm restaurant ambiance */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${PAGE_BACKGROUNDS.menuHero})` }}
        />
        {/* Dark warm gradient overlay for high contrast editorial typography */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-stone-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-stone-950/40" />

        <div className="relative z-10 max-w-2xl py-12 text-left">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-extrabold tracking-tight text-white leading-[1.08]">
            Delicious Food.<br />
            <span className="text-primary">Great Moments.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-200/90 mt-4 max-w-lg leading-relaxed font-normal">
            Order your favourites and enjoy a seamless dining experience.
          </p>

          {/* Explore Menu Button */}
          <div className="mt-8">
            <button
              onClick={scrollToMenu}
              className="inline-flex items-center gap-3 bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold px-8 py-3.5 rounded-full text-base shadow-soft hover:shadow-card transition-all cursor-pointer"
            >
              <span>Explore Menu</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Menu Navigation & Filter Section */}
      <div ref={menuSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 no-scrollbar">
          {categoryFilters.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategoryKey === cat.key;

            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryKey(cat.key)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 select-none cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-card text-foreground hover:bg-secondary/70 border border-border shadow-soft'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted/70 shadow-soft"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-card border border-border rounded-xl px-4 py-2.5 pr-9 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:border-primary shadow-soft cursor-pointer"
              >
                <option value="default">Sort</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
              <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 3. Food Cards Grid — Matching Reference Image */}
        <main className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-card rounded-2xl border border-border p-4 animate-pulse space-y-3">
                  <div className="w-full h-44 bg-secondary rounded-xl" />
                  <div className="w-2/3 h-5 bg-secondary rounded" />
                  <div className="w-full h-8 bg-secondary rounded" />
                  <div className="w-full h-10 bg-secondary rounded-xl" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center text-muted bg-card rounded-2xl border border-border max-w-md mx-auto">
              <p className="text-base font-bold text-danger">Failed to load restaurant menu</p>
              <p className="text-xs text-muted mt-1">Please verify the database connection and try again.</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
              >
                Retry
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-16 text-center text-muted bg-card rounded-2xl border border-border max-w-md mx-auto">
              <p className="text-base font-bold text-foreground">No matching dishes found</p>
              <p className="text-xs text-muted mt-1">Try searching for other regional delicacies.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const activeVariantId = selectedVariants[item.id] || item.variants[0]?.id;
                const activeVariant = item.variants.find((v) => v.id === activeVariantId) || item.variants[0];
                const cartItem = cartLines.find((c) => c.variantId === activeVariant?.id);
                const localQty = itemQuantities[item.id] || 1;
                const imageUrl = getDishImageUrl(item);
                const isVeg = item.dietary === 'VEG' || item.dietary === 'VEGAN';
                const hasMultipleVariants = item.variants.length > 1;

                return (
                  <div
                    key={item.id}
                    className="bg-card rounded-2xl border border-border/80 overflow-hidden shadow-soft hover:shadow-card transition-all duration-200 flex flex-col justify-between text-left p-3.5"
                  >
                    <div>
                      {/* Dish Image with Indian Veg/Non-Veg Indicator in Top-Right Corner */}
                      <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden bg-stone-100">
                        <img
                          src={imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
                        />

                        {/* Veg / Non-Veg Indicator Icon (Reference standard) */}
                        <div className="absolute top-2.5 right-2.5 bg-white/95 p-1 rounded-sm shadow-sm flex items-center justify-center">
                          <div
                            className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
                              isVeg ? 'border-emerald-600' : 'border-red-600'
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isVeg ? 'bg-emerald-600' : 'bg-red-600'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Out of stock overlay */}
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center">
                            <span className="bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content: Title & Short Description */}
                      <div className="pt-3.5 px-1">
                        <h3 className="text-base font-bold text-foreground font-sans leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Portions & Action Section */}
                    <div className="pt-4 px-1">
                      {/* Case 1: Half and Full Variants Available (Side-by-side selection pills) */}
                      {hasMultipleVariants ? (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {item.variants.map((v) => {
                            const isSelected = activeVariant?.id === v.id;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => setSelectedVariants((prev) => ({ ...prev, [item.id]: v.id }))}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-primary bg-primary-light/40 shadow-xs'
                                    : 'border-border bg-card hover:bg-secondary/40'
                                }`}
                              >
                                <span className="block text-[11px] font-medium text-muted truncate">
                                  {v.label}
                                </span>
                                <span className="block text-sm font-bold text-foreground font-tabular mt-0.5">
                                  {formatPaise(v.pricePaise)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Case 2: Single Variant (Stepper on Left, Price on Right) */
                        <div className="flex items-center justify-between mb-3 py-1">
                          {/* Stepper */}
                          <div className="flex items-center border border-border rounded-xl bg-card">
                            <button
                              type="button"
                              onClick={() => updateItemLocalQty(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold font-tabular text-foreground">
                              {localQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemLocalQty(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Price */}
                          <span className="text-base font-bold font-tabular text-foreground">
                            {formatPaise(activeVariant?.pricePaise || 0)}
                          </span>
                        </div>
                      )}

                      {/* Add to Order Button (Matching Reference: Vibrant Orange with Cart Icon) */}
                      {cartItem ? (
                        <div className="flex items-center justify-between bg-primary-light border border-primary/30 rounded-xl p-1.5">
                          <span className="text-xs font-bold text-primary pl-2 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> In Order ({cartItem.qty})
                          </span>
                          <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 shadow-xs">
                            <button
                              onClick={() => addItem(activeVariant, item, -1)}
                              className="w-7 h-7 flex items-center justify-center text-muted hover:text-danger rounded cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold font-tabular text-foreground">
                              {cartItem.qty}
                            </span>
                            <button
                              onClick={() => addItem(activeVariant, item, 1)}
                              disabled={cartItem.qty >= 20}
                              className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground rounded cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!item.isAvailable || !activeVariant?.isAvailable}
                          onClick={() => {
                            if (activeVariant) {
                              const qtyToAdd = hasMultipleVariants ? 1 : localQty;
                              addItem(activeVariant, item, qtyToAdd);
                            }
                          }}
                          className="w-full bg-primary hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 text-white py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-soft hover:shadow transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Add to Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Floating Bottom Cart Bar for Mobile */}
      {totalItems() > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border p-3 sm:hidden shadow-elevated">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-full bg-primary text-white py-3.5 px-5 rounded-2xl font-bold flex items-center justify-between shadow-card active:scale-98 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5" />
              <span>{totalItems()} {totalItems() === 1 ? 'item' : 'items'} in cart</span>
            </div>
            <div className="flex items-center gap-2 font-tabular">
              <span>View Cart</span>
              <span>·</span>
              <span className="text-base font-extrabold">{formatPaise(totalPaise())}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
