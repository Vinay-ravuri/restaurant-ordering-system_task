import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, AlertCircle, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { api } from '../lib/api.js';
import { formatPaise } from '../lib/utils.js';
import { Button } from './ui/Button.js';
import { Input } from './ui/Input.js';
import { getDishImageUrl } from '../lib/dishImages.js';

export function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    setIsDrawerOpen,
    updateQty,
    removeItem,
    clearCart,
    orderType,
    setOrderType,
    tableNumber,
    setTableNumber,
    customerName,
    setCustomerName,
    totalPaise,
  } = useCart();

  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleCheckout = async () => {
    setErrorMessage(null);
    setFieldErrors({});

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please select dishes from the menu.');
      return;
    }

    if (orderType === 'DINE_IN' && (!tableNumber || tableNumber < 1 || tableNumber > 200)) {
      setFieldErrors({ tableNumber: 'Please enter a valid table number between 1 and 200' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.orders.create({
        orderType,
        tableNumber: orderType === 'DINE_IN' ? Number(tableNumber) : null,
        customerName: customerName.trim() || undefined,
        idempotencyKey: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        items: items.map((i) => ({
          variantId: i.variantId,
          qty: i.qty,
        })),
      });

      clearCart();
      setIsDrawerOpen(false);
      navigate(`/order/${response.order.id}`);
    } catch (err: any) {
      if (err.fields) {
        setFieldErrors(err.fields);
      }
      setErrorMessage(err.error || 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-card border-l border-border shadow-elevated flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-card/90 backdrop-blur">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-serif text-foreground">Your Dining Order</h2>
                    <span className="text-[11px] text-muted font-medium">
                      {items.length} {items.length === 1 ? 'dish selected' : 'dishes selected'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-muted hover:text-foreground hover:bg-secondary rounded-xl transition-colors cursor-pointer"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="m-4 p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-danger">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                    <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-muted mb-3">
                      <UtensilsCrossed className="w-8 h-8 opacity-60" />
                    </div>
                    <h3 className="text-base font-bold font-serif text-foreground">Your cart is empty</h3>
                    <p className="text-xs text-muted mt-1 max-w-xs leading-relaxed">
                      Explore our regional delicacies and add mouthwatering dishes to start an order.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsDrawerOpen(false)}
                      className="mt-5 rounded-xl font-bold"
                    >
                      Browse Menu
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Dining Type & Table Selector */}
                    <div className="p-4 rounded-2xl bg-secondary/60 border border-border space-y-3">
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                        Dining Preference
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOrderType('DINE_IN')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                            orderType === 'DINE_IN'
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-card text-muted hover:text-foreground border border-border'
                          }`}
                        >
                          🍽️ Dine-In
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('TAKEAWAY')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                            orderType === 'TAKEAWAY'
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-card text-muted hover:text-foreground border border-border'
                          }`}
                        >
                          🛍️ Takeaway
                        </button>
                      </div>

                      {orderType === 'DINE_IN' && (
                        <div>
                          <Input
                            label="Table Number (1 - 200)"
                            type="number"
                            min={1}
                            max={200}
                            value={tableNumber || ''}
                            onChange={(e) => setTableNumber(e.target.value ? Number(e.target.value) : null)}
                            placeholder="e.g. 5"
                            error={fieldErrors.tableNumber}
                            required
                            className="rounded-xl"
                          />
                        </div>
                      )}

                      <Input
                        label="Guest Name (Optional)"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Vinay"
                        className="rounded-xl"
                      />
                    </div>

                    {/* Line Items */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                        Selected Items
                      </span>
                      {items.map((line) => {
                        const thumb = getDishImageUrl({ name: line.itemName });

                        return (
                          <div
                            key={line.variantId}
                            className="p-3 bg-card rounded-2xl border border-border flex items-center justify-between gap-3 shadow-soft hover:border-primary/20 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={thumb}
                                alt={line.itemName}
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-foreground truncate leading-tight">
                                  {line.itemName}
                                </h4>
                                <span className="text-[11px] text-muted block mt-0.5">
                                  {line.variantLabel} · <span className="font-tabular">{formatPaise(line.unitPricePaise)}</span>
                                </span>
                              </div>
                            </div>

                            {/* Stepper */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center bg-secondary rounded-xl p-0.5 border border-border/60">
                                <button
                                  onClick={() => updateQty(line.variantId, line.qty - 1)}
                                  className="w-6 h-6 flex items-center justify-center text-muted hover:text-danger rounded-lg transition-colors cursor-pointer"
                                >
                                  {line.qty === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                                </button>
                                <span className="w-6 text-center text-xs font-bold font-tabular text-foreground">
                                  {line.qty}
                                </span>
                                <button
                                  onClick={() => updateQty(line.variantId, line.qty + 1)}
                                  disabled={line.qty >= 20}
                                  className="w-6 h-6 flex items-center justify-center text-muted hover:text-foreground rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="font-tabular text-xs font-bold text-foreground w-14 text-right">
                                {formatPaise(line.unitPricePaise * line.qty)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Footer Checkout Bar */}
              {items.length > 0 && (
                <div className="p-5 border-t border-border bg-card/95 backdrop-blur space-y-3">
                  <div className="space-y-1.5 text-xs text-muted">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-tabular text-foreground font-semibold">
                        {formatPaise(totalPaise())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & Kitchen Service</span>
                      <span className="text-emerald-700 font-medium">Included</span>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between items-baseline">
                      <span className="text-sm font-bold text-foreground font-serif">Order Total</span>
                      <span className="text-xl font-bold font-tabular text-foreground font-serif">
                        {formatPaise(totalPaise())}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    isLoading={isSubmitting}
                    onClick={handleCheckout}
                    className="gap-2 rounded-2xl font-bold shadow-soft"
                  >
                    <span>Send Order to Kitchen</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
