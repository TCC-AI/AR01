import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import Landing from './components/layout/Landing';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import WarehouseView from './components/warehouse/WarehouseView';
import WarehouseSetup from './components/warehouse/WarehouseSetup';
import InventoryPage from './components/inventory/InventoryPage';
import ARNavigationPage from './components/navigation/ARNavigationPage';
import Subscription from './components/dashboard/Subscription';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* AR Navigation (can be accessed without full auth for shared links) */}
      <Route path="/navigate/:warehouseId/:productId" element={<ARNavigationPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="warehouse/:warehouseId" element={<WarehouseView />} />
        <Route path="warehouse/:warehouseId/setup" element={<WarehouseSetup />} />
        <Route path="warehouse/:warehouseId/inventory" element={<InventoryPage />} />
        <Route path="warehouse/:warehouseId/navigate" element={<ARNavigationPage />} />
        <Route path="subscription" element={<Subscription />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
