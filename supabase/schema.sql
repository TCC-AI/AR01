-- ============================================================
-- AR01 倉庫 AR 導航 SaaS - Supabase Database Schema
-- ============================================================

-- 啟用必要的擴展
create extension if not exists "uuid-ossp";

-- ============================================================
-- 使用者設定檔 (profiles) - 擴展 Supabase Auth
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  company text,
  avatar_url text,
  subscription text not null default 'free'
    check (subscription in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 新使用者註冊時自動建立 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, company)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'company'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 倉庫 (warehouses)
-- ============================================================
create table public.warehouses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text default '',
  -- 倉庫邊界多邊形 (JSON 格式的 Point2D 陣列)
  boundary_polygon jsonb not null default '[]',
  -- 倉庫實際尺寸 (公尺)
  width real not null default 20,
  depth real not null default 30,
  height real not null default 6,
  -- 空間構圖狀態
  mapping_status text not null default 'not_started'
    check (mapping_status in ('not_started', 'in_progress', 'completed')),
  -- 空間資料 (Gemini 處理後)
  spatial_data jsonb,
  -- 導航網格
  navigation_mesh jsonb,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_warehouses_user_id on public.warehouses(user_id);

-- ============================================================
-- 空間構圖照片 (scan_photos)
-- ============================================================
create table public.scan_photos (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid references public.warehouses(id) on delete cascade not null,
  photo_url text not null,
  -- 拍照時的相機位置和方向
  camera_position jsonb not null default '{"x":0,"y":0,"z":0}',
  camera_rotation jsonb not null default '{"x":0,"y":0,"z":0}',
  -- Gemini 分析結果
  analysis_result jsonb,
  captured_at timestamptz not null default now()
);

create index idx_scan_photos_warehouse on public.scan_photos(warehouse_id);

-- ============================================================
-- 區域 / 貨架 (zones)
-- ============================================================
create table public.zones (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid references public.warehouses(id) on delete cascade not null,
  name text not null,
  type text not null default 'rack'
    check (type in ('rack', 'shelf', 'floor_area', 'cold_storage', 'hazardous', 'custom')),
  -- 區域邊界 (2D 多邊形)
  polygon jsonb not null default '[]',
  -- 3D 位置 (中心點)
  position jsonb not null default '{"x":0,"y":0,"z":0}',
  -- 3D 尺寸
  size jsonb not null default '{"x":2,"y":2,"z":2}',
  -- 貨架層數
  shelf_levels int default 1,
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_zones_warehouse on public.zones(warehouse_id);

-- ============================================================
-- 貨物 (products)
-- ============================================================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid references public.warehouses(id) on delete cascade not null,
  name text not null,
  sku text not null,
  description text default '',
  category text default '',
  quantity int not null default 0,
  unit text not null default 'pcs',
  -- 商品圖片 (URL 陣列)
  images jsonb not null default '[]',
  -- 空間定位
  zone_id uuid references public.zones(id) on delete set null,
  position jsonb not null default '{"x":0,"y":0,"z":0}',
  shelf_level int,
  location_label text default '',
  -- 額外屬性
  attributes jsonb not null default '{}',
  -- 用於 Pinecone 向量搜尋的 embedding ID
  embedding_id text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_warehouse on public.products(warehouse_id);
create index idx_products_zone on public.products(zone_id);
create index idx_products_sku on public.products(sku);
create index idx_products_category on public.products(category);
-- 全文搜尋索引
create index idx_products_name_search on public.products using gin(to_tsvector('simple', name));

-- ============================================================
-- 導航記錄 (navigation_logs) - 用於分析
-- ============================================================
create table public.navigation_logs (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid references public.warehouses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  start_position jsonb,
  end_position jsonb,
  distance real,
  duration_seconds real,
  created_at timestamptz not null default now()
);

create index idx_nav_logs_warehouse on public.navigation_logs(warehouse_id);
create index idx_nav_logs_created on public.navigation_logs(created_at);

-- ============================================================
-- Row Level Security (RLS) 政策
-- ============================================================
alter table public.profiles enable row level security;
alter table public.warehouses enable row level security;
alter table public.scan_photos enable row level security;
alter table public.zones enable row level security;
alter table public.products enable row level security;
alter table public.navigation_logs enable row level security;

-- Profiles: 使用者只能看自己的
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Warehouses: 使用者只能存取自己的倉庫
create policy "Users can CRUD own warehouses"
  on public.warehouses for all using (auth.uid() = user_id);

-- Scan Photos: 透過倉庫擁有者控制
create policy "Users can CRUD own warehouse photos"
  on public.scan_photos for all
  using (warehouse_id in (
    select id from public.warehouses where user_id = auth.uid()
  ));

-- Zones: 透過倉庫擁有者控制
create policy "Users can CRUD own warehouse zones"
  on public.zones for all
  using (warehouse_id in (
    select id from public.warehouses where user_id = auth.uid()
  ));

-- Products: 透過倉庫擁有者控制
create policy "Users can CRUD own warehouse products"
  on public.products for all
  using (warehouse_id in (
    select id from public.warehouses where user_id = auth.uid()
  ));

-- Navigation Logs: 透過倉庫擁有者控制
create policy "Users can view own navigation logs"
  on public.navigation_logs for all
  using (warehouse_id in (
    select id from public.warehouses where user_id = auth.uid()
  ));

-- ============================================================
-- 自動更新 updated_at
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger update_warehouses_updated_at
  before update on public.warehouses
  for each row execute function public.update_updated_at();

create trigger update_zones_updated_at
  before update on public.zones
  for each row execute function public.update_updated_at();

create trigger update_products_updated_at
  before update on public.products
  for each row execute function public.update_updated_at();

-- ============================================================
-- Supabase Storage Buckets (透過 Dashboard 設定)
-- ============================================================
-- bucket: warehouse-photos  (倉庫構圖照片)
-- bucket: product-images    (貨物圖片)
