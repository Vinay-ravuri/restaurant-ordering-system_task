import { create } from 'zustand';
import type { CartLineItem, ItemVariant, MenuItem, OrderType } from '../types/index.js';

export interface CartStore {
  items: CartLineItem[];
  orderType: OrderType;
  tableNumber: number | null;
  customerName: string;
  isDrawerOpen: boolean;

  // Actions
  addItem: (variant: ItemVariant, item: MenuItem, qty?: number) => void;
  updateQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setTableNumber: (table: number | null) => void;
  setCustomerName: (name: string) => void;
  setIsDrawerOpen: (isOpen: boolean) => void;
  evictItem: (itemId: string) => { evicted: boolean; itemName?: string };

  // Computed
  totalPaise: () => number;
  totalItems: () => number;
}

const STORAGE_KEY = 'restaurantos_cart_v1';

function loadInitialState(): {
  items: CartLineItem[];
  orderType: OrderType;
  tableNumber: number | null;
  customerName: string;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        orderType: parsed.orderType === 'TAKEAWAY' ? 'TAKEAWAY' : 'DINE_IN',
        tableNumber: typeof parsed.tableNumber === 'number' ? parsed.tableNumber : 1,
        customerName: typeof parsed.customerName === 'string' ? parsed.customerName : '',
      };
    }
  } catch (e) {
    console.warn('Failed to load cart from storage:', e);
  }
  return {
    items: [],
    orderType: 'DINE_IN',
    tableNumber: 1,
    customerName: '',
  };
}

const initial = loadInitialState();

export const useCart = create<CartStore>((set, get) => ({
  items: initial.items,
  orderType: initial.orderType,
  tableNumber: initial.tableNumber,
  customerName: initial.customerName,
  isDrawerOpen: false,

  addItem: (variant, item, qty = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.variantId === variant.id);
      let newItems: CartLineItem[];

      if (existingIndex > -1) {
        newItems = [...state.items];
        const nextQty = Math.min(newItems[existingIndex].qty + qty, 20);
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          qty: nextQty,
        };
      } else {
        const newLine: CartLineItem = {
          variantId: variant.id,
          itemId: item.id,
          itemName: item.name,
          variantLabel: variant.label,
          unitPricePaise: variant.pricePaise,
          qty: Math.min(qty, 20),
          dietary: item.dietary,
          imageUrl: item.imageUrl,
        };
        newItems = [...state.items, newLine];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: newItems,
        orderType: state.orderType,
        tableNumber: state.tableNumber,
        customerName: state.customerName,
      }));

      return { items: newItems, isDrawerOpen: true };
    });
  },

  updateQty: (variantId, qty) => {
    set((state) => {
      let newItems: CartLineItem[];
      if (qty <= 0) {
        newItems = state.items.filter((i) => i.variantId !== variantId);
      } else {
        newItems = state.items.map((i) =>
          i.variantId === variantId ? { ...i, qty: Math.min(qty, 20) } : i
        );
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: newItems,
        orderType: state.orderType,
        tableNumber: state.tableNumber,
        customerName: state.customerName,
      }));

      return { items: newItems };
    });
  },

  removeItem: (variantId) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.variantId !== variantId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: newItems,
        orderType: state.orderType,
        tableNumber: state.tableNumber,
        customerName: state.customerName,
      }));
      return { items: newItems };
    });
  },

  clearCart: () => {
    set((state) => {
      localStorage.removeItem(STORAGE_KEY);
      return { items: [] };
    });
  },

  setOrderType: (orderType) => {
    set((state) => {
      const tableNumber = orderType === 'TAKEAWAY' ? null : (state.tableNumber || 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: state.items,
        orderType,
        tableNumber,
        customerName: state.customerName,
      }));
      return { orderType, tableNumber };
    });
  },

  setTableNumber: (tableNumber) => {
    set((state) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: state.items,
        orderType: state.orderType,
        tableNumber,
        customerName: state.customerName,
      }));
      return { tableNumber };
    });
  },

  setCustomerName: (customerName) => {
    set((state) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: state.items,
        orderType: state.orderType,
        tableNumber: state.tableNumber,
        customerName,
      }));
      return { customerName };
    });
  },

  setIsDrawerOpen: (isDrawerOpen) => {
    set({ isDrawerOpen });
  },

  evictItem: (itemId: string) => {
    const state = get();
    const match = state.items.find((i) => i.itemId === itemId);
    if (!match) return { evicted: false };

    const remaining = state.items.filter((i) => i.itemId !== itemId);
    set({ items: remaining });

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      items: remaining,
      orderType: state.orderType,
      tableNumber: state.tableNumber,
      customerName: state.customerName,
    }));

    return { evicted: true, itemName: match.itemName };
  },

  totalPaise: () => {
    const items = get().items;
    return items.reduce((sum, item) => sum + item.unitPricePaise * item.qty, 0);
  },

  totalItems: () => {
    const items = get().items;
    return items.reduce((sum, item) => sum + item.qty, 0);
  },
}));
