import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductList from './ProductList';
import { productApi } from '../../services/api';
import { useWarehouseStore } from '../../stores/warehouseStore';
import type { Product } from '@shared/types';

export default function InventoryPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const { products, setProducts, addProduct, removeProduct } = useWarehouseStore();
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', description: '', category: '',
    quantity: 0, unit: 'pcs', locationLabel: '',
    posX: 0, posY: 0, posZ: 0,
  });

  useEffect(() => {
    async function load() {
      if (!warehouseId) return;
      try {
        const res = await productApi.list(warehouseId);
        if (res.success && res.data) setProducts(res.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [warehouseId, setProducts]);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!warehouseId || !query.trim()) {
        // Reload all
        const res = await productApi.list(warehouseId!);
        if (res.success && res.data) setProducts(res.data);
        return;
      }
      const res = await productApi.search(warehouseId, query);
      if (res.success && res.data) {
        setProducts(res.data.map((r) => r.product));
      }
    },
    [warehouseId, setProducts],
  );

  const handleAddProduct = useCallback(async () => {
    if (!warehouseId || !newProduct.name.trim()) return;
    const res = await productApi.create({
      warehouseId,
      name: newProduct.name,
      sku: newProduct.sku,
      description: newProduct.description,
      category: newProduct.category,
      quantity: newProduct.quantity,
      unit: newProduct.unit,
      locationLabel: newProduct.locationLabel,
      position: { x: newProduct.posX, y: newProduct.posY, z: newProduct.posZ },
    } as never);
    if (res.success && res.data) {
      addProduct(res.data as unknown as Product);
      setShowAddForm(false);
      setNewProduct({
        name: '', sku: '', description: '', category: '',
        quantity: 0, unit: 'pcs', locationLabel: '',
        posX: 0, posY: 0, posZ: 0,
      });
    }
  }, [warehouseId, newProduct, addProduct]);

  const handleDelete = useCallback(
    async (productId: string) => {
      await productApi.delete(productId);
      removeProduct(productId);
    },
    [removeProduct],
  );

  const handleNavigate = useCallback(
    (productId: string) => {
      navigate(`/app/warehouse/${warehouseId}/navigate?target=${productId}`);
    },
    [navigate, warehouseId],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary text-sm">
          + Add Product
        </button>
      </div>

      {/* Add product form */}
      {showAddForm && (
        <div className="card space-y-3">
          <h3 className="font-semibold">New Product</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Product name *"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="input"
            />
            <input
              placeholder="SKU"
              value={newProduct.sku}
              onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              className="input"
            />
            <input
              placeholder="Category"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="input"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Qty"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({ ...newProduct, quantity: Number(e.target.value) })}
                className="input flex-1"
              />
              <select
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                className="input w-24"
              >
                <option value="pcs">pcs</option>
                <option value="box">box</option>
                <option value="kg">kg</option>
                <option value="pallet">pallet</option>
              </select>
            </div>
          </div>
          <input
            placeholder="Location label (e.g. A-3-2)"
            value={newProduct.locationLabel}
            onChange={(e) => setNewProduct({ ...newProduct, locationLabel: e.target.value })}
            className="input"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-400">X (m)</label>
              <input
                type="number"
                value={newProduct.posX}
                onChange={(e) => setNewProduct({ ...newProduct, posX: Number(e.target.value) })}
                className="input mt-1"
                step="0.5"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Y (m)</label>
              <input
                type="number"
                value={newProduct.posY}
                onChange={(e) => setNewProduct({ ...newProduct, posY: Number(e.target.value) })}
                className="input mt-1"
                step="0.5"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Z (m)</label>
              <input
                type="number"
                value={newProduct.posZ}
                onChange={(e) => setNewProduct({ ...newProduct, posZ: Number(e.target.value) })}
                className="input mt-1"
                step="0.5"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddProduct} className="btn-primary flex-1">
              Add Product
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <ProductList
        products={products}
        onEdit={(p) => navigate(`/app/warehouse/${warehouseId}/inventory?edit=${p.id}`)}
        onDelete={handleDelete}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
      />
    </div>
  );
}
