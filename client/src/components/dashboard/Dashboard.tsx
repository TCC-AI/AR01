import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { warehouseApi } from '../../services/api';
import { useWarehouseStore } from '../../stores/warehouseStore';
import { useAuthStore } from '../../stores/authStore';
import type { Warehouse } from '@shared/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { warehouses, setWarehouses } = useWarehouseStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await warehouseApi.list();
        if (res.success && res.data) setWarehouses(res.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setWarehouses]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    const res = await warehouseApi.create({ name: newName });
    if (res.success && res.data) {
      setWarehouses([...warehouses, res.data as unknown as Warehouse]);
      setNewName('');
      setShowCreate(false);
      navigate(`/app/warehouse/${res.data.id}/setup`);
    }
  }, [newName, warehouses, setWarehouses, navigate]);

  const handleDelete = useCallback(
    async (id: string) => {
      await warehouseApi.delete(id);
      setWarehouses(warehouses.filter((w) => w.id !== id));
    },
    [warehouses, setWarehouses],
  );

  const tierLimits = { free: 1, pro: 10, enterprise: 999 };
  const maxWarehouses = tierLimits[user?.subscription || 'free'] ?? 1;
  const canCreateMore = warehouses.length < maxWarehouses;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Warehouses</h1>
          <p className="text-sm text-slate-400">
            {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''}
            {user?.subscription === 'free' && ` (${maxWarehouses} max)`}
          </p>
        </div>
        {canCreateMore && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            + New Warehouse
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-3">Create New Warehouse</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Warehouse name"
              className="input flex-1"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button onClick={handleCreate} className="btn-primary">Create</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && warehouses.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">No warehouses yet</h3>
          <p className="text-slate-400 mb-6">Create your first warehouse to get started.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Create First Warehouse
          </button>
        </div>
      )}

      {!loading && warehouses.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <WarehouseCard
              key={wh.id}
              warehouse={wh}
              onOpen={() => navigate(`/app/warehouse/${wh.id}`)}
              onDelete={() => handleDelete(wh.id)}
            />
          ))}
        </div>
      )}

      {!canCreateMore && (
        <div className="mt-8 card border-primary-500/30 text-center">
          <h3 className="font-semibold mb-2">Warehouse Limit Reached</h3>
          <p className="text-slate-400 text-sm mb-4">
            Upgrade to Pro for up to 10 warehouses.
          </p>
          <button
            onClick={() => navigate('/app/subscription')}
            className="btn-primary text-sm"
          >
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  );
}

function WarehouseCard({
  warehouse,
  onOpen,
  onDelete,
}: {
  warehouse: Warehouse;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const statusColors = {
    not_started: 'text-slate-400',
    in_progress: 'text-yellow-400',
    completed: 'text-green-400',
  };

  return (
    <div className="card group">
      <div className="aspect-video bg-slate-700 rounded-xl mb-3 flex items-center justify-center">
        <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h3 className="font-semibold truncate">{warehouse.name}</h3>
      <p className="text-xs text-slate-400 mt-1">
        {warehouse.dimensions.width}m x {warehouse.dimensions.depth}m |{' '}
        <span className={statusColors[warehouse.mappingStatus]}>
          {warehouse.mappingStatus.replace('_', ' ')}
        </span>
      </p>
      <div className="flex gap-2 mt-3">
        <button onClick={onOpen} className="btn-primary text-xs flex-1 py-2">
          Open
        </button>
        <button onClick={onDelete} className="text-xs px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10">
          Delete
        </button>
      </div>
    </div>
  );
}
