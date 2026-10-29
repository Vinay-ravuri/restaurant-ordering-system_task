import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { api } from '../lib/api.js';
import { formatPaise } from '../lib/utils.js';
import { Button } from './ui/Button.js';
import { Input } from './ui/Input.js';

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
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
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold font-serif text-foreground">Your Order Cart</h2>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-muted hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {items.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-muted">
                    <ShoppingBag className="w-12 h-12 text-border mb-3" />
                    <p className="text-base font-semibold text-foreground">Your cart is empty</p>
                    <p className="text-xs text-muted mt-1 max-w-xs">
                      Explore our authentic regional dishes and add items with your choice of portion size.
                    </p>
                  </div>
                ) : (
                  items.map((line) => (
                    <div
                      key={line.variantId}
                      className="flex items-center justify-between gap-3 p-3.5 bg-background rounded-2xl border border-border/80"
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground truncate block">
                            {line.itemName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                          <span className="font-medium bg-secondary px-1.5 py-0.5 rounded text-[11px]">
                            {line.variantLabel}
                          </span>
                          <span className="font-tabular font-semibold text-foreground">
                            {formatPaise(line.unitPricePaise)}
                          </span>
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1 shadow-sm">
                        <button
                          onClick={() => updateQty(line.variantId, line.qty - 1)}
                          className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                          aria-label="Decrease quantity"
                        >
                          {line.qty === 1 ? <Trash2 className="w-3.5 h-3.5 text-danger" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-tabular text-foreground">
                          {line.qty}
                        </span>
                        <button
                          onClick={() => updateQty(line.variantId, line.qty + 1)}
                          disabled={line.qty >= 20}
                          className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* General error banner */}
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-danger text-xs text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Order Options & Checkout Footer */}
              {items.length > 0 && (
                <div className="p-5 border-t border-border bg-card/60 backdrop-blur space-y-4 text-left">
                  {/* Dine-In vs Takeaway Toggle */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Fulfillment Option
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
                      <button
                        type="button"
                        onClick={() => setOrderType('DINE_IN')}
                        className={`py-2 text-xs font-bold rounded-lg transition-all ${
                          orderType === 'DINE_IN' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'
                        }`}
                      >
                        🍽️ Dine-In
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('TAKEAWAY')}
                        className={`py-2 text-xs font-bold rounded-lg transition-all ${
                          orderType === 'TAKEAWAY' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'
                        }`}
                      >
                        🥡 Takeaway
                      </button>
                    </div>
                  </div>

                  {/* Table number if dine-in */}
                  {orderType === 'DINE_IN' && (
                    <Input
                      label="Table Number (1–200)"
                      type="number"
                      min={1}
                      max={200}
                      value={tableNumber ?? ''}
                      onChange={(e) => setTableNumber(e.target.value ? parseInt(e.target.value, 10) : null)}
                      placeholder="e.g. 12"
                      error={fieldErrors.tableNumber}
                    />
                  )}

                  {/* Optional Customer Name */}
                  <Input
                    label="Customer Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Vinay"
                    maxLength={60}
                    error={fieldErrors.customerName}
                  />

                  {/* Pricing Total Summary */}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted block">Estimated Total</span>
                      <span className="text-xs text-muted/80">Recalculated on server</span>
                    </div>
                    <span className="text-xl font-bold font-tabular text-foreground">
                      {formatPaise(totalPaise())}
                    </span>
                  </div>

                  {/* Submit Button */}
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    isLoading={isSubmitting}
                    onClick={handleCheckout}
                    className="gap-2"
                  >
                    <span>Confirm & Place Order</span>
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
