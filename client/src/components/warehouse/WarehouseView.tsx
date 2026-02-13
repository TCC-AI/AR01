import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { warehouseApi, productApi } from '../../services/api';
import { useWarehouseStore } from '../../stores/warehouseStore';

export default function WarehouseView() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const { setCurrentWarehouse, currentWarehouse, setProducts, products } = useWarehouseStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!warehouseId) return;
      try {
        const [whRes, prodRes] = await Promise.all([
          warehouseApi.get(warehouseId),
          productApi.list(warehouseId),
        ]);
        if (whRes.success && whRes.data) setCurrentWarehouse(whRes.data);
        if (prodRes.success && prodRes.data) setProducts(prodRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [warehouseId, setCurrentWarehouse, setProducts]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentWarehouse) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-400">Warehouse not found</p>
      </div>
    );
  }

  const statusColors = {
    not_started: 'bg-slate-500',
    in_progress: 'bg-yellow-500',
    completed: 'bg-green-500',
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{currentWarehouse.name}</h1>
          <p className="text-sm text-slate-400">
            {currentWarehouse.dimensions.width}m x {currentWarehouse.dimensions.depth}m x{' '}
            {currentWarehouse.dimensions.height}m
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${statusColors[currentWarehouse.mappingStatus]}`}
          />
          <span className="text-xs text-slate-400 capitalize">
            {currentWarehouse.mappingStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => navigate(`/app/warehouse/${warehouseId}/setup`)}
          className="card p-4 text-center hover:border-primary-500 transition-colors"
        >
          <div className="text-2xl mb-2">
            <svg className="w-8 h-8 mx-auto text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div className="text-sm font-medium">Setup & Scan</div>
          <div className="text-xs text-slate-400">Configure & map space</div>
        </button>

        <button
          onClick={() => navigate(`/app/warehouse/${warehouseId}/inventory`)}
          className="card p-4 text-center hover:border-primary-500 transition-colors"
        >
          <div className="text-2xl mb-2">
            <svg className="w-8 h-8 mx-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="text-sm font-medium">Inventory</div>
          <div className="text-xs text-slate-400">{products.length} products</div>
        </button>

        <button
          onClick={() => navigate(`/app/warehouse/${warehouseId}/navigate`)}
          className="card p-4 text-center hover:border-primary-500 transition-colors"
        >
          <div className="text-2xl mb-2">
            <svg className="w-8 h-8 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="text-sm font-medium">AR Navigate</div>
          <div className="text-xs text-slate-400">Find products</div>
        </button>

        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">
            <svg className="w-8 h-8 mx-auto text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-sm font-medium">Analytics</div>
          <div className="text-xs text-slate-400">Coming soon</div>
        </div>
      </div>

      {/* Zones overview */}
      {currentWarehouse.zones && currentWarehouse.zones.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-3">Zones ({currentWarehouse.zones.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {currentWarehouse.zones.map((zone) => (
              <div
                key={zone.id}
                className="p-3 rounded-xl border border-slate-700"
                style={{ borderLeftColor: zone.color, borderLeftWidth: 4 }}
              >
                <div className="text-sm font-medium">{zone.name}</div>
                <div className="text-xs text-slate-400 capitalize">{zone.type.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent products */}
      {products.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Products</h3>
            <button
              onClick={() => navigate(`/app/warehouse/${warehouseId}/inventory`)}
              className="text-sm text-primary-400"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                  {product.images.length > 0 ? (
                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{product.name}</div>
                  <div className="text-xs text-slate-400">
                    {product.quantity} {product.unit} | {product.location.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
