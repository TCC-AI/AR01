// ============================================================
// AR01 倉庫 AR 導航 SaaS - 共用型別定義
// ============================================================

// === 使用者 & 認證 ===

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
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
  company?: string;
}

// === 2D/3D 空間基礎型別 ===

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox3D {
  min: Point3D;
  max: Point3D;
}

// === 倉庫 (Warehouse) ===

export interface Warehouse {
  id: string;
  userId: string;
  name: string;
  description: string;
  /** 倉庫邊界多邊形頂點 (2D 俯視圖) */
  boundaryPolygon: Point2D[];
  /** 倉庫實際尺寸 (公尺) */
  dimensions: {
    width: number;   // X 軸
    depth: number;   // Y 軸
    height: number;  // Z 軸 (天花板高度)
  };
  /** 空間構圖狀態 */
  mappingStatus: 'not_started' | 'in_progress' | 'completed';
  /** 空間構圖照片 URLs */
  scanPhotos: ScanPhoto[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScanPhoto {
  id: string;
  url: string;
  /** 拍照時的相機位置 */
  cameraPosition: Point3D;
  /** 拍照方向 (角度) */
  cameraRotation: Point3D;
  capturedAt: string;
}

// === 區域 / 貨架 (Zone) ===

export type ZoneType = 'rack' | 'shelf' | 'floor_area' | 'cold_storage' | 'hazardous' | 'custom';

export interface Zone {
  id: string;
  warehouseId: string;
  name: string;
  type: ZoneType;
  /** 區域在倉庫中的多邊形邊界 (2D) */
  polygon: Point2D[];
  /** 區域 3D 位置 (中心點) */
  position: Point3D;
  /** 區域 3D 尺寸 */
  size: Point3D;
  /** 貨架層數 (若為貨架類型) */
  shelfLevels?: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// === 貨物 (Product / Item) ===

export interface Product {
  id: string;
  warehouseId: string;
  /** 品項名稱 */
  name: string;
  /** SKU 編號 */
  sku: string;
  /** 商品描述 */
  description: string;
  /** 商品分類 */
  category: string;
  /** 數量 */
  quantity: number;
  /** 單位 (箱/個/kg...) */
  unit: string;
  /** 商品圖片 URLs */
  images: string[];
  /** 商品在倉庫中的 3D 位置 (空間定位) */
  location: ProductLocation;
  /** 額外屬性 (重量、保存期限...) */
  attributes: Record<string, string>;
  /** 上次盤點時間 */
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductLocation {
  /** 所屬區域 */
  zoneId: string;
  /** 精確 3D 位置 */
  position: Point3D;
  /** 貨架層數 (第幾層) */
  shelfLevel?: number;
  /** 位置標籤 (例如: A-3-2 表示 A 區第 3 排第 2 層) */
  label: string;
}

// === AR 導航 ===

export interface NavigationRequest {
  warehouseId: string;
  /** 使用者目前位置 */
  startPosition: Point3D;
  /** 目標貨物 ID */
  targetProductId: string;
}

export interface NavigationPath {
  /** 導航路徑節點 */
  waypoints: Point3D[];
  /** 預估距離 (公尺) */
  distance: number;
  /** 預估步行時間 (秒) */
  estimatedTime: number;
  /** 目標貨物資訊 */
  targetProduct: Product;
}

export interface ARNavigationOverlay {
  /** 導航箭頭/路線的 3D 座標 */
  pathPoints: Point3D[];
  /** 浮現在目標位置的貨物卡片 */
  productCard: {
    product: Product;
    screenPosition: Point2D;
    distance: number;
  };
}

// === 空間構圖 (Spatial Mapping) ===

export interface SpatialMappingSession {
  id: string;
  warehouseId: string;
  status: 'capturing' | 'processing' | 'completed' | 'failed';
  /** 已拍攝照片數 */
  photoCount: number;
  /** 建議的最少照片數 */
  requiredPhotos: number;
  /** 覆蓋率百分比 */
  coveragePercent: number;
  /** Gemini API 生成的空間資料 */
  spatialData?: SpatialData;
  createdAt: string;
}

export interface SpatialData {
  /** 偵測到的地面平面 */
  floorPlane: Point3D[];
  /** 偵測到的牆壁 */
  walls: WallSegment[];
  /** 偵測到的障礙物 */
  obstacles: Obstacle[];
  /** 可行走區域的導航網格 */
  navigationMesh: Point3D[][];
}

export interface WallSegment {
  start: Point3D;
  end: Point3D;
  height: number;
}

export interface Obstacle {
  position: Point3D;
  size: Point3D;
  type: string;
}

// === SaaS 訂閱 ===

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
  maxWarehouses: number;
  maxProductsPerWarehouse: number;
  maxScanPhotos: number;
  maxFileSize: number; // MB
  aiFeatures: boolean;
  multiUser: boolean;
  apiAccess: boolean;
  analytics: 'basic' | 'advanced' | 'full';
}

// === API 回應 ===

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

// === 搜尋 ===

export interface ProductSearchRequest {
  warehouseId: string;
  query: string;
  category?: string;
  limit?: number;
}

export interface ProductSearchResult {
  product: Product;
  /** 相似度分數 (0-1) */
  score: number;
  /** 距離使用者目前位置的距離 */
  distance?: number;
}
