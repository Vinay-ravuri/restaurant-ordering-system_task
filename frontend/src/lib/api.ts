import type {
  Category,
  MenuItem,
  ItemVariant,
  Order,
  TodayMetrics,
  User,
  OrderStatus,
  OrderType,
  ApiError,
} from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Send httpOnly session cookies
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorData: ApiError = data || {
      error: `Request failed with status ${response.status}`,
    };
    throw errorData;
  }

  return data as T;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ message: string; user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    logout: () =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
      }),
    me: () => request<{ user: User }>('/auth/me'),
  },

  menu: {
    getPublic: () => request<{ categories: Category[] }>('/menu'),
    getCategories: () => request<{ categories: Category[] }>('/categories'),
  },

  orders: {
    create: (orderInput: {
      orderType: OrderType;
      tableNumber?: number | null;
      customerName?: string | null;
      idempotencyKey?: string | null;
      items: Array<{ variantId: string; qty: number }>;
    }) =>
      request<{ order: Order; isDuplicate?: boolean }>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderInput),
      }),
    getById: (id: string) => request<{ order: Order }>(`/orders/${id}`),
    updateStatus: (id: string, status: OrderStatus) =>
      request<{ order: Order }>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  kitchen: {
    getOrders: () => request<{ orders: Order[] }>('/kitchen/orders'),
  },

  admin: {
    getTodayMetrics: () => request<TodayMetrics>('/admin/today'),
    getOrders: (params?: { status?: string; orderType?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.orderType) searchParams.set('orderType', params.orderType);
      if (params?.search) searchParams.set('search', params.search);
      const qs = searchParams.toString();
      return request<{ orders: Order[]; total: number }>(`/admin/orders${qs ? `?${qs}` : ''}`);
    },
    getMenu: () => request<{ categories: Category[] }>('/admin/menu'),

    // Categories
    createCategory: (data: { name: string; sortOrder?: number; description?: string }) =>
      request<{ category: Category }>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateCategory: (id: string, data: Partial<Category>) =>
      request<{ category: Category }>(`/admin/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteCategory: (id: string) =>
      request<{ message: string }>(`/admin/categories/${id}`, {
        method: 'DELETE',
      }),

    // Menu Items
    createItem: (data: {
      categoryId: string;
      name: string;
      description: string;
      imageUrl?: string | null;
      dietary?: string | null;
      isAvailable?: boolean;
    }) =>
      request<{ item: MenuItem }>('/admin/items', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateItem: (id: string, data: Partial<MenuItem>) =>
      request<{ item: MenuItem }>(`/admin/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    toggleAvailability: (id: string, isAvailable: boolean) =>
      request<{ item: MenuItem }>(`/admin/items/${id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable }),
      }),
    deleteItem: (id: string) =>
      request<{ message: string }>(`/admin/items/${id}`, {
        method: 'DELETE',
      }),

    // Variants
    createVariant: (itemId: string, data: { label: string; pricePaise: number; isAvailable?: boolean }) =>
      request<{ variant: ItemVariant }>(`/admin/items/${itemId}/variants`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateVariant: (id: string, data: Partial<ItemVariant>) =>
      request<{ variant: ItemVariant }>(`/admin/variants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteVariant: (id: string) =>
      request<{ message: string }>(`/admin/variants/${id}`, {
        method: 'DELETE',
      }),
  },
};
