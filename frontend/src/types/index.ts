export type Role = 'ADMIN' | 'KITCHEN';

export type OrderType = 'DINE_IN' | 'TAKEAWAY';

export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  createdAt?: string;
}

export interface ItemVariant {
  id: string;
  itemId: string;
  label: string; // "Regular", "Half", "Full"
  pricePaise: number;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  dietary?: 'VEG' | 'NON_VEG' | 'VEGAN' | 'CONTAINS_EGG' | null;
  variants: ItemVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  description?: string | null;
  isActive: boolean;
  items?: MenuItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  itemId?: string | null;
  variantId?: string | null;
  nameSnapshot: string;
  variantLabelSnapshot: string;
  unitPricePaise: number;
  qty: number;
  lineTotalPaise: number;
}

export interface Order {
  id: string;
  orderNumber?: string | null;
  orderType: OrderType;
  tableNumber?: number | null;
  customerName?: string | null;
  status: OrderStatus;
  totalPaise: number;
  idempotencyKey?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  preparingAt?: string | null;
  readyAt?: string | null;
  servedAt?: string | null;
}

export interface CartLineItem {
  variantId: string;
  itemId: string;
  itemName: string;
  variantLabel: string;
  unitPricePaise: number;
  qty: number;
  dietary?: string | null;
  imageUrl?: string | null;
}

export interface TodayMetrics {
  istDateString: string;
  dayRange: {
    startUTC: string;
    endUTC: string;
  };
  orderCount: number;
  totalRevenuePaise: number;
  averageOrderValuePaise: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByType: Record<OrderType, number>;
  orders: Order[];
}

export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}
