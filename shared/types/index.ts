// === User & Auth Types ===

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// === AR Scene Types ===

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ARModel {
  id: string;
  name: string;
  url: string;
  format: 'glb' | 'gltf' | 'obj' | 'fbx';
  thumbnail?: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

export interface ARMarker {
  id: string;
  name: string;
  type: 'image' | 'surface' | 'face';
  imageUrl?: string;
  models: ARModel[];
}

export interface ARScene {
  id: string;
  name: string;
  description: string;
  userId: string;
  markers: ARMarker[];
  models: ARModel[];
  isPublic: boolean;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

// === SaaS / Subscription Types ===

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  maxScenes: number;
  maxModels: number;
  maxFileSize: number; // in MB
  customMarkers: boolean;
  analytics: 'basic' | 'advanced' | 'full';
  apiAccess: boolean;
}

// === API Response Types ===

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// === Analytics Types ===

export interface SceneAnalytics {
  sceneId: string;
  views: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  interactionCount: number;
  date: string;
}
