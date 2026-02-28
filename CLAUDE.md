# StoreHouseAR - 工作日誌

> 倉庫 AR 導航 SaaS 平台開發記錄
> 原始專案代號：AR01
> 記錄日期：2026-02-28

---

## 一、專案概述

**StoreHouseAR（AR01）** 是一套基於 PWA 的倉庫 AR 導航 SaaS 平台。
使用者透過手機/平板即可完成倉庫空間構圖、貨物管理，並以擴增實境（AR）引導找到貨物位置。

### 核心流程

```
1. 繪製倉庫邊界 → 2. 拍照掃描空間 → 3. 登錄貨物 → 4. AR 導航找貨
```

### SaaS 訂閱方案

| 方案 | 倉庫數 | 貨物數 | 功能 |
|------|--------|--------|------|
| Free | 1 | 50 | 基本 AI |
| Pro | 10 | 5,000 | 完整 AI + 向量搜尋 + 多貨物路線優化 |
| Enterprise | 無限 | 無限 | API 存取 + 全功能 |

---

## 二、技術架構

### 技術棧一覽

| 層級 | 技術 | 用途 |
|------|------|------|
| **前端框架** | React 18 + TypeScript | PWA 行動優先應用 |
| **3D / AR** | Three.js + react-three-fiber + @react-three/xr | AR 渲染、3D 場景、導航視覺化 |
| **樣式** | Tailwind CSS | Mobile-first RWD（Indigo 主色調） |
| **狀態管理** | Zustand | 客戶端狀態（auth, AR, warehouse） |
| **建構工具** | Vite + TypeScript | 快速建構 & HMR |
| **PWA** | vite-plugin-pwa | Service Worker、離線支援、可安裝 |
| **路由** | React Router v6 | 前端路由 |
| **後端** | Express + TypeScript | REST API 伺服器 |
| **資料庫** | Supabase (PostgreSQL) | 使用者/倉庫/貨物資料 + RLS 安全策略 |
| **認證** | JWT + Supabase Auth | Token-based 認證 |
| **檔案上傳** | Multer | 照片/圖片上傳 |
| **AI** | Google Gemini API | 照片分析 → 空間理解 + 貨物辨識 |
| **向量搜尋** | Pinecone | 語意搜尋貨物 |
| **部署** | Vercel (前端) + Railway (後端) | 雲端託管 |
| **容器化** | Docker (Node 20 Alpine) | 多階段建構 |

### Monorepo 架構

```
AR01/
├── client/          # React 18 PWA 前端
├── server/          # Express 後端 API
├── shared/          # 共享 TypeScript 型別定義
├── supabase/        # 資料庫 Schema
├── uploads/         # 本機檔案儲存
├── Dockerfile       # 多階段 Docker 建構
├── docker-compose.yml
└── package.json     # npm workspaces monorepo root
```

---

## 三、開發歷程紀錄

### Commit 1: 初始化專案

- 建立 Monorepo 結構（npm workspaces: client / server / shared）
- 設定 TypeScript 共用設定
- 建立基礎 package.json

### Commit 2: AR 行動 SaaS 平台核心

**前端（client/）**

- 建立 React 18 + Vite + TypeScript 前端應用
- 整合 PWA（vite-plugin-pwa）支援離線與安裝
- 建立 Tailwind CSS 行動優先 UI 設計
- 實作 AR 核心元件：
  - `ARViewer.tsx` — WebXR AR 檢視器
  - `ARScene.tsx` — Three.js 3D 場景
  - `ARControls.tsx` — AR 互動控制
  - `ModelObject.tsx` — 3D 物件渲染
  - `SceneEditor.tsx` — 場景編輯器
- 實作倉庫管理元件：
  - `PolygonEditor.tsx` — 拖曳編輯倉庫邊界多邊形
  - `SpatialMapper.tsx` — 多角度照片掃描 UI
  - `WarehouseView.tsx` — 倉庫儀表板
  - `WarehouseSetup.tsx` — 倉庫設定精靈
- 實作庫存管理：
  - `ProductList.tsx` — 貨物列表
  - `InventoryPage.tsx` — 庫存管理頁面
- 實作 AR 導航：
  - `ARNavigator.tsx` — 3D AR 視圖 + 路徑顯示
  - `ARNavigationPage.tsx` — 搜尋 → 導航頁面
- 實作認證頁面：`Login.tsx`、`Register.tsx`
- 實作儀表板：`Dashboard.tsx`（倉庫列表）、`Subscription.tsx`（訂閱管理）
- 實作共用佈局：`Layout.tsx`、`Landing.tsx`（行銷頁）
- 建立 Zustand 狀態管理：
  - `authStore.ts` — 使用者認證狀態 + token 持久化
  - `warehouseStore.ts` — 當前倉庫 + 區域資料
  - `arStore.ts` — AR 場景狀態 + WebXR 啟用狀態
- 自訂 Hooks：`useWebXR.ts`、`useDeviceOrientation.ts`

**後端（server/）**

- 建立 Express + TypeScript REST API
- JWT 認證中介層
- CRUD 路由：Auth、Warehouses、Products、Navigation、Spatial、Subscription、Scenes、Upload
- 服務模組：
  - `gemini.ts` — Google Gemini API 整合（照片分析 + 貨物辨識）
  - `pinecone.ts` — Pinecone 向量搜尋整合
  - `navigation.ts` — A* 尋路演算法 + 路徑平滑化

**共享型別（shared/）**

- 定義所有共用 TypeScript 介面：User、Warehouse、Product、Zone、Navigation、Point3D 等

### Commit 3: Supabase + Gemini + Pinecone 整合

- 建立完整 Supabase 資料庫 Schema（`supabase/schema.sql`）
- 6 張核心資料表：
  1. `profiles` — 使用者設定檔（擴展 Supabase Auth）
  2. `warehouses` — 倉庫資料（邊界多邊形 + 空間資料 + 導航網格）
  3. `scan_photos` — 空間構圖照片（相機位置/方向 + Gemini 分析結果）
  4. `zones` — 區域/貨架（2D 多邊形 + 3D 位置/尺寸）
  5. `products` — 貨物（3D 座標 + 圖片 + SKU + embedding ID）
  6. `navigation_logs` — 導航記錄（用於分析）
- Row Level Security（RLS）安全策略：使用者只能存取自己的資料
- 自動觸發器：`updated_at` 自動更新
- 全文搜尋索引：貨物名稱
- Storage Buckets 規劃：`warehouse-photos`、`product-images`

---

## 四、資料庫設計

### ER 關係圖（簡化）

```
auth.users
    │
    ▼ (1:1)
profiles
    │
    ▼ (1:N)
warehouses
    │
    ├──▶ scan_photos    (1:N)
    ├──▶ zones          (1:N)
    │       │
    │       ▼ (1:N)
    ├──▶ products
    └──▶ navigation_logs (1:N)
```

### RLS 安全策略

- `profiles`: 使用者只能查看/更新自己的 profile
- `warehouses`: 使用者只能 CRUD 自己的倉庫
- `scan_photos`, `zones`, `products`, `navigation_logs`: 透過倉庫擁有者控制存取

---

## 五、API 端點設計

### 認證

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/login` | 使用者登入 |
| POST | `/api/auth/register` | 使用者註冊 |
| GET | `/api/auth/me` | 取得當前使用者 |

### 倉庫管理

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/warehouses` | 列出使用者的倉庫 |
| GET | `/api/warehouses/:id` | 取得倉庫詳情 |
| POST | `/api/warehouses` | 建立倉庫 |
| PUT | `/api/warehouses/:id` | 更新倉庫 |
| DELETE | `/api/warehouses/:id` | 刪除倉庫 |
| POST | `/api/warehouses/:id/zones` | 新增區域 |

### 貨物管理

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/products` | 列出貨物（分頁） |
| POST | `/api/products` | 建立貨物 |
| PUT | `/api/products/:id` | 更新貨物 |
| DELETE | `/api/products/:id` | 刪除貨物 |
| POST | `/api/products/search` | 搜尋貨物 |
| POST | `/api/products/recognize` | AI 圖片辨識 |

### AR 導航

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/navigation/path` | 單一貨物路徑計算 |
| POST | `/api/navigation/multi` | 多貨物最佳路線 |

### 空間構圖

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/spatial/analyze-photo` | Gemini 分析照片 |
| POST | `/api/spatial/generate-map` | 從照片生成 3D 地圖 |
| GET | `/api/spatial/:warehouseId/status` | 取得構圖進度 |

### 訂閱管理

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/subscription/plans` | 列出定價方案 |
| POST | `/api/subscription/checkout` | 建立 Stripe 結帳 |
| GET | `/api/subscription/manage` | Stripe 客戶入口 |

---

## 六、環境變數設定

```env
# === 伺服器 ===
PORT=3001
NODE_ENV=development

# === Supabase ===
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# === Google Gemini AI ===
GEMINI_API_KEY=<your-gemini-key>

# === Pinecone 向量搜尋 ===
PINECONE_API_KEY=<your-pinecone-key>
PINECONE_INDEX=ar01-products
PINECONE_ENVIRONMENT=us-east-1

# === Stripe 付款 ===
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...

# === 前端 (VITE_ 前綴) ===
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=http://localhost:3001/api
```

---

## 七、Supabase 設定教學

### Step 1: 註冊與建立專案

1. 前往 https://supabase.com 註冊帳號（建議用 GitHub 登入）
2. 點擊 **New Project** 建立新專案
3. 填寫名稱、資料庫密碼、選擇區域
4. 等待 1-2 分鐘專案建立完成

### Step 2: 取得 API Key

1. 前往 Settings → API
2. 複製以下三個值：
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
   - **service_role key**（點 Reveal）→ `SUPABASE_SERVICE_ROLE_KEY`（僅限後端）

### Step 3: 執行 SQL Schema

1. 前往左側選單 **SQL Editor**
2. 將 `supabase/schema.sql` 的全部內容複製貼上
3. 點擊右下角 **Run** 按鈕（或 Ctrl+Enter）
4. 看到 "Success. No rows returned" 即為成功

### Step 4: 建立 Storage Buckets

1. 前往左側選單 **Storage**
2. 建立 bucket：`warehouse-photos`（Public）
3. 建立 bucket：`product-images`（Public）

### Step 5: 驗證

前往 **Table Editor**，確認可以看到 6 張資料表：
`profiles`、`warehouses`、`scan_photos`、`zones`、`products`、`navigation_logs`

---

## 八、開發與部署指令

### 本機開發

```bash
npm install                  # 安裝所有依賴
npm run dev                  # 同時啟動前端 + 後端
npm run dev:client           # 僅啟動前端 (Vite dev server)
npm run dev:server           # 僅啟動後端 (tsx watch)
```

### 建構與生產

```bash
npm run build                # 建構前端 (Vite) + 後端 (tsc)
npm start                    # 啟動生產伺服器
```

### Docker 部署

```bash
docker-compose up -d         # 啟動容器化服務
```

### 部署目標

- **前端 PWA** → Vercel
- **後端 API** → Railway
- **資料庫** → Supabase（雲端管理）

---

## 九、核心演算法

### A* 尋路演算法

位於 `server/src/services/navigation.ts`：
- 將倉庫空間轉換為導航網格（navigation mesh）
- 使用 A* 演算法計算最短路徑，避開障礙物
- 路徑平滑化處理，產生自然的行走路線
- 支援多貨物路線優化（Pro 方案以上）

### Gemini AI 空間分析

位於 `server/src/services/gemini.ts`：
- 接收倉庫多角度照片
- 透過 Gemini Vision API 分析空間結構
- 辨識地板、牆壁、貨架、障礙物
- 自動生成 3D 空間地圖
- 貨物照片辨識（自動填入品名、類別等）

### Pinecone 向量搜尋

位於 `server/src/services/pinecone.ts`：
- 將貨物資訊轉換為向量嵌入
- 支援語意搜尋（例如「紅色的大箱子」）
- 提供更智慧的貨物搜尋體驗

---

## 十、專案現狀與下一步

### 已完成

- [x] Monorepo 架構建立
- [x] React 18 PWA 前端（所有頁面與元件）
- [x] Express REST API 後端（所有路由與服務）
- [x] WebXR / Three.js AR 核心功能
- [x] Supabase 資料庫 Schema + RLS 安全策略
- [x] Google Gemini AI 整合（空間分析 + 貨物辨識）
- [x] Pinecone 向量搜尋整合
- [x] A* 導航尋路演算法
- [x] SaaS 訂閱方案設計
- [x] Docker 容器化設定
- [x] PWA 離線支援

### 待辦事項

- [ ] 設定 Supabase 專案與環境變數
- [ ] 設定 Google Gemini API Key
- [ ] 設定 Pinecone 索引
- [ ] 設定 Stripe 訂閱付款
- [ ] 端對端測試
- [ ] 部署至 Vercel + Railway
- [ ] 效能優化與監控
- [ ] 使用者回饋與迭代

---

## 十一、專案目錄完整結構

```
AR01/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ar/
│   │   │   │   ├── ARViewer.tsx
│   │   │   │   ├── ARScene.tsx
│   │   │   │   ├── ARControls.tsx
│   │   │   │   ├── ModelObject.tsx
│   │   │   │   └── SceneEditor.tsx
│   │   │   ├── warehouse/
│   │   │   │   ├── PolygonEditor.tsx
│   │   │   │   ├── SpatialMapper.tsx
│   │   │   │   ├── WarehouseView.tsx
│   │   │   │   └── WarehouseSetup.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── ProductList.tsx
│   │   │   │   └── InventoryPage.tsx
│   │   │   ├── navigation/
│   │   │   │   ├── ARNavigator.tsx
│   │   │   │   └── ARNavigationPage.tsx
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   └── Register.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   └── Subscription.tsx
│   │   │   └── layout/
│   │   │       ├── Layout.tsx
│   │   │       └── Landing.tsx
│   │   ├── hooks/
│   │   │   ├── useWebXR.ts
│   │   │   └── useDeviceOrientation.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── supabase.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── warehouseStore.ts
│   │   │   └── arStore.ts
│   │   └── styles/
│   │       └── index.css
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── warehouses.ts
│   │   │   ├── products.ts
│   │   │   ├── navigation.ts
│   │   │   ├── spatial.ts
│   │   │   ├── subscription.ts
│   │   │   ├── scenes.ts
│   │   │   └── upload.ts
│   │   ├── services/
│   │   │   ├── gemini.ts
│   │   │   ├── pinecone.ts
│   │   │   └── navigation.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── config/
│   │   │   ├── supabase.ts
│   │   │   └── database.ts
│   │   └── index.ts
│   └── package.json
├── shared/
│   └── types/
│       └── index.ts
├── supabase/
│   └── schema.sql
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

*本文件由 Claude AI 自動生成，記錄 StoreHouseAR（AR01）專案的完整開發歷程。*
