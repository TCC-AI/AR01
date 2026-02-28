import { create } from 'zustand';
import type { Warehouse, Zone, Product, Point3D } from '@shared/types';

interface WarehouseState {
  warehouses: Warehouse[];
  currentWarehouse: (Warehouse & { zones?: Zone[] }) | null;
  products: Product[];
  selectedProductId: string | null;
  isNavigating: boolean;
  navigationTarget: Product | null;
  userPosition: Point3D;

  setWarehouses: (warehouses: Warehouse[]) => void;
  setCurrentWarehouse: (warehouse: (Warehouse & { zones?: Zone[] }) | null) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  selectProduct: (productId: string | null) => void;
  startNavigation: (product: Product) => void;
  stopNavigation: () => void;
  setUserPosition: (position: Point3D) => void;
}

export const useWarehouseStore = create<WarehouseState>((set) => ({
  warehouses: [],
  currentWarehouse: null,
  products: [],
  selectedProductId: null,
  isNavigating: false,
  navigationTarget: null,
  userPosition: { x: 0, y: 0, z: 0 },

  setWarehouses: (warehouses) => set({ warehouses }),
  setCurrentWarehouse: (warehouse) => set({ currentWarehouse: warehouse }),
  setProducts: (products) => set({ products }),
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  updateProduct: (product) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === product.id ? product : p)),
    })),
  removeProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
    })),
  selectProduct: (productId) => set({ selectedProductId: productId }),
  startNavigation: (product) =>
    set({ isNavigating: true, navigationTarget: product }),
  stopNavigation: () =>
    set({ isNavigating: false, navigationTarget: null }),
  setUserPosition: (position) => set({ userPosition: position }),
}));
