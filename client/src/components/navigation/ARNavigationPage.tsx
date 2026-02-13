import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ARNavigator from './ARNavigator';
import { navigationApi, productApi } from '../../services/api';
import { useWarehouseStore } from '../../stores/warehouseStore';
import type { Product, Point3D, NavigationPath } from '@shared/types';

export default function ARNavigationPage() {
  const { warehouseId, productId: directProductId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, setProducts, userPosition } = useWarehouseStore();

  const targetProductId = directProductId || searchParams.get('target');
  const resolvedWarehouseId = warehouseId || searchParams.get('warehouse') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [navPath, setNavPath] = useState<NavigationPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [isARMode, setIsARMode] = useState(false);

  // Load products if not loaded
  useEffect(() => {
    async function load() {
      if (!resolvedWarehouseId || products.length > 0) return;
      const res = await productApi.list(resolvedWarehouseId);
      if (res.success && res.data) setProducts(res.data);
    }
    load();
  }, [resolvedWarehouseId, products.length, setProducts]);

  // Auto-navigate if target product specified
  useEffect(() => {
    if (targetProductId) {
      startNavigation(targetProductId, userPosition);
    }
  }, [targetProductId]); // eslint-disable-line react-hooks/exhaustive-deps

  const startNavigation = useCallback(
    async (prodId: string, startPos: Point3D) => {
      if (!resolvedWarehouseId) return;
      setLoading(true);
      try {
        const res = await navigationApi.getPath(resolvedWarehouseId, startPos, prodId);
        if (res.success && res.data) {
          setNavPath(res.data);
          setSelectedProduct(res.data.targetProduct);
          setIsARMode(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [resolvedWarehouseId],
  );

  const handleSearch = useCallback(async () => {
    if (!resolvedWarehouseId || !searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await productApi.search(resolvedWarehouseId, searchQuery);
      if (res.success && res.data) {
        setProducts(res.data.map((r) => r.product));
      }
    } finally {
      setLoading(false);
    }
  }, [resolvedWarehouseId, searchQuery, setProducts]);

  // If AR navigation is active
  if (isARMode && navPath && selectedProduct) {
    return (
      <ARNavigator
        waypoints={navPath.waypoints}
        targetProduct={selectedProduct}
        distance={navPath.distance}
        estimatedTime={navPath.estimatedTime}
        onClose={() => {
          setIsARMode(false);
          setNavPath(null);
        }}
        isARMode={true}
      />
    );
  }

  // Product search/selection screen
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">AR Navigation</h1>
      <p className="text-slate-400 text-sm">
        Search for a product and get AR navigation to its location.
      </p>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for a product..."
          className="input flex-1"
          autoFocus
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary px-6">
          {loading ? '...' : 'Find'}
        </button>
      </div>

      {/* Results */}
      {products.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-400">
            {products.length} product(s) found
          </h3>
          {products.map((product) => (
            <div
              key={product.id}
              className="card p-4 flex items-center gap-4 cursor-pointer hover:border-primary-500 transition-colors"
              onClick={() => startNavigation(product.id, userPosition)}
            >
              <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                {product.images.length > 0 ? (
                  <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{product.name}</h3>
                <div className="text-xs text-slate-400">
                  {product.sku && `SKU: ${product.sku} | `}
                  {product.quantity} {product.unit}
                  {product.location.label && ` | ${product.location.label}`}
                </div>
              </div>
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back button for nested route */}
      {resolvedWarehouseId && (
        <button
          onClick={() => navigate(`/app/warehouse/${resolvedWarehouseId}`)}
          className="btn-secondary w-full"
        >
          Back to Warehouse
        </button>
      )}
    </div>
  );
}
