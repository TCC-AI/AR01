import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ARScene,
  PaginatedResponse,
  SubscriptionPlan,
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

// Scenes API
export const scenesApi = {
  list: (page = 1, pageSize = 20) =>
    request<ARScene[]>(`/scenes?page=${page}&pageSize=${pageSize}`) as Promise<
      PaginatedResponse<ARScene>
    >,

  get: (id: string) => request<ARScene>(`/scenes/${id}`),

  create: (scene: Partial<ARScene>) =>
    request<ARScene>('/scenes', {
      method: 'POST',
      body: JSON.stringify(scene),
    }),

  update: (id: string, scene: Partial<ARScene>) =>
    request<ARScene>(`/scenes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scene),
    }),

  delete: (id: string) =>
    request<void>(`/scenes/${id}`, { method: 'DELETE' }),
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

// Upload API
export const uploadApi = {
  model: async (file: File) => {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append('model', file);

    const response = await fetch(`${API_URL}/upload/model`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return response.json() as Promise<ApiResponse<{ url: string; name: string }>>;
  },
};
