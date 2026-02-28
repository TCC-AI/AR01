import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Warehouse,
  Zone,
  Product,
  NavigationPath,
  PaginatedResponse,
  SubscriptionPlan,
  ProductSearchResult,
} from '@shared/types';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  const data = await response.json();
  return data;
}

// Auth API
export const authApi = {
  login: (body: LoginRequest) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  register: (body: RegisterRequest) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request<AuthResponse>('/auth/me'),
};

// Warehouse API
export const warehouseApi = {
  list: () => request<Warehouse[]>('/warehouses'),

  get: (id: string) => request<Warehouse & { zones: Zone[]; scan_photos: unknown[] }>(`/warehouses/${id}`),

  create: (data: Partial<Warehouse>) =>
    request<Warehouse>('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Warehouse>) =>
    request<Warehouse>(`/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/warehouses/${id}`, { method: 'DELETE' }),

  addZone: (warehouseId: string, zone: Partial<Zone>) =>
    request<Zone>(`/warehouses/${warehouseId}/zones`, {
      method: 'POST',
      body: JSON.stringify(zone),
    }),
};

// Product API
export const productApi = {
  list: (warehouseId: string, page = 1, pageSize = 50) =>
    request<Product[]>(
      `/products?warehouseId=${warehouseId}&page=${page}&pageSize=${pageSize}`,
    ) as Promise<PaginatedResponse<Product>>,

  get: (id: string) => request<Product>(`/products/${id}`),

  create: (data: Partial<Product> & { warehouseId: string }) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/products/${id}`, { method: 'DELETE' }),

  search: (warehouseId: string, query: string) =>
    request<ProductSearchResult[]>('/products/search', {
      method: 'POST',
      body: JSON.stringify({ warehouseId, query }),
    }),

  recognize: (imageBase64: string) =>
    request<{ name: string; category: string; description: string; suggestedAttributes: Record<string, string> }>(
      '/products/recognize',
      {
        method: 'POST',
        body: JSON.stringify({ imageBase64 }),
      },
    ),
};

// Navigation API
export const navigationApi = {
  getPath: (warehouseId: string, startPosition: { x: number; y: number; z: number }, targetProductId: string) =>
    request<NavigationPath>('/navigation/path', {
      method: 'POST',
      body: JSON.stringify({ warehouseId, startPosition, targetProductId }),
    }),

  getMultiPath: (
    warehouseId: string,
    startPosition: { x: number; y: number; z: number },
    targetProductIds: string[],
  ) =>
    request<NavigationPath & { products: Product[]; optimizedOrder: string[] }>(
      '/navigation/multi',
      {
        method: 'POST',
        body: JSON.stringify({ warehouseId, startPosition, targetProductIds }),
      },
    ),
};

// Spatial Mapping API
export const spatialApi = {
  analyzePhoto: (warehouseId: string, imageBase64: string) =>
    request<{ photo: unknown; analysis: unknown }>('/spatial/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ warehouseId, imageBase64 }),
    }),

  generateMap: (warehouseId: string) =>
    request<unknown>('/spatial/generate-map', {
      method: 'POST',
      body: JSON.stringify({ warehouseId }),
    }),

  getStatus: (warehouseId: string) =>
    request<{
      status: string;
      photoCount: number;
      hasSpatialData: boolean;
      requiredPhotos: number;
      coveragePercent: number;
    }>(`/spatial/${warehouseId}/status`),
};

// Subscription API
export const subscriptionApi = {
  plans: () => request<SubscriptionPlan[]>('/subscription/plans'),

  createCheckout: (planId: string) =>
    request<{ url: string }>('/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),

  manage: () => request<{ url: string }>('/subscription/manage'),
};
