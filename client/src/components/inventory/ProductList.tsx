import { useState, type FormEvent } from 'react';
import type { Product } from '@shared/types';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onNavigate: (productId: string) => void;
  onSearch: (query: string) => void;
}

/**
 * 貨物列表 - 顯示倉庫中的所有貨物
 * - 搜尋功能
 * - 每個貨物可點擊「導航」啟動 AR 導航
 */
export default function ProductList({
  products,
  onEdit,
  onDelete,
  onNavigate,
  onSearch,
}: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    onSearch(searchQuery);
  }

  return (
    <div className="space-y-4">
      {/* 搜尋列 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products (name, SKU, category...)"
            className="input pl-10"
          />
        </div>
        <button type="submit" className="btn-primary px-4">
          Search
        </button>
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="btn-secondary px-3"
        >
          {viewMode === 'grid' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )}
        </button>
      </form>

      {/* 貨物列表 */}
      {products.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p>No products found</p>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="space-y-2">
          {products.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              onEdit={() => onEdit(product)}
              onDelete={() => onDelete(product.id)}
              onNavigate={() => onNavigate(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {products.map((product) => (
            <ProductGridItem
              key={product.id}
              product={product}
              onEdit={() => onEdit(product)}
              onNavigate={() => onNavigate(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductListItem({
  product,
  onEdit,
  onDelete,
  onNavigate,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="card p-4 flex items-center gap-4">
      {/* 縮圖 */}
      <div className="w-14 h-14 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
        {product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )}
      </div>

      {/* 資訊 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{product.name}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>SKU: {product.sku}</span>
          <span>|</span>
          <span>{product.quantity} {product.unit}</span>
          {product.location.label && (
            <>
              <span>|</span>
              <span className="text-primary-400">{product.location.label}</span>
            </>
          )}
        </div>
      </div>

      {/* 動作按鈕 */}
      <div className="flex gap-1 shrink-0">
        <button
          onClick={onNavigate}
          className="p-2 rounded-lg bg-primary-600/20 text-primary-400 hover:bg-primary-600/30"
          title="Navigate to product"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button
          onClick={onEdit}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
          title="Edit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
          title="Delete"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ProductGridItem({
  product,
  onEdit,
  onNavigate,
}: {
  product: Product;
  onEdit: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="card p-3">
      <div className="aspect-square bg-slate-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
        {product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )}
      </div>
      <h4 className="text-sm font-medium truncate">{product.name}</h4>
      <p className="text-xs text-slate-400">{product.quantity} {product.unit}</p>
      {product.location.label && (
        <p className="text-xs text-primary-400 mt-1">{product.location.label}</p>
      )}
      <div className="flex gap-1 mt-2">
        <button onClick={onNavigate} className="btn-primary text-xs flex-1 py-1.5">
          Navigate
        </button>
        <button onClick={onEdit} className="btn-secondary text-xs px-2 py-1.5">
          Edit
        </button>
      </div>
    </div>
  );
}
