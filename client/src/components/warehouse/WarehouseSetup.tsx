import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import PolygonEditor from './PolygonEditor';
import SpatialMapper from './SpatialMapper';
import { warehouseApi, spatialApi } from '../../services/api';
import { useWarehouseStore } from '../../stores/warehouseStore';
import type { Point2D } from '@shared/types';

type SetupStep = 'boundary' | 'dimensions' | 'scan' | 'complete';

export default function WarehouseSetup() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const { currentWarehouse, setCurrentWarehouse } = useWarehouseStore();
  const [step, setStep] = useState<SetupStep>('boundary');
  const [vertices, setVertices] = useState<Point2D[]>([]);
  const [dimensions, setDimensions] = useState({ width: 20, depth: 30, height: 6 });
  const [photoCount, setPhotoCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!warehouseId) return;
      const res = await warehouseApi.get(warehouseId);
      if (res.success && res.data) {
        setCurrentWarehouse(res.data);
        setVertices(res.data.boundary_polygon || []);
        setDimensions({
          width: res.data.width || 20,
          depth: res.data.depth || 30,
          height: res.data.height || 6,
        });
      }
    }
    load();
  }, [warehouseId, setCurrentWarehouse]);

  // Load spatial mapping status
  useEffect(() => {
    async function loadStatus() {
      if (!warehouseId) return;
      const res = await spatialApi.getStatus(warehouseId);
      if (res.success && res.data) {
        setPhotoCount(res.data.photoCount);
      }
    }
    loadStatus();
  }, [warehouseId]);

  const handleSaveBoundary = useCallback(async () => {
    if (!warehouseId) return;
    setSaving(true);
    try {
      await warehouseApi.update(warehouseId, {
        boundaryPolygon: vertices,
        dimensions,
      } as never);
      setStep('scan');
    } finally {
      setSaving(false);
    }
  }, [warehouseId, vertices, dimensions]);

  const handlePhotoTaken = useCallback(
    async (imageBase64: string) => {
      if (!warehouseId) return;
      await spatialApi.analyzePhoto(warehouseId, imageBase64);
      setPhotoCount((c) => c + 1);
    },
    [warehouseId],
  );

  const handleGenerateMap = useCallback(async () => {
    if (!warehouseId) return;
    setSaving(true);
    try {
      await spatialApi.generateMap(warehouseId);
      setStep('complete');
    } finally {
      setSaving(false);
    }
  }, [warehouseId]);

  if (!currentWarehouse) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Warehouse Setup</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['boundary', 'scan', 'complete'] as const).map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => setStep(s === 'complete' ? step : s)}
              className={`w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center
                ${step === s ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              {i + 1}
            </button>
            <span className={`ml-2 text-sm ${step === s ? 'text-white' : 'text-slate-400'}`}>
              {s === 'boundary' ? 'Boundary' : s === 'scan' ? 'Spatial Scan' : 'Complete'}
            </span>
            {i < 2 && <div className="w-8 h-0.5 bg-slate-700 mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Boundary polygon */}
      {step === 'boundary' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold mb-2">Warehouse Dimensions (meters)</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Width (X)</label>
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
                  className="input mt-1"
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Depth (Y)</label>
                <input
                  type="number"
                  value={dimensions.depth}
                  onChange={(e) => setDimensions({ ...dimensions, depth: Number(e.target.value) })}
                  className="input mt-1"
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Height (Z)</label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })}
                  className="input mt-1"
                  min={1}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ height: '400px' }}>
            <h2 className="font-semibold mb-2">Boundary Shape</h2>
            <p className="text-xs text-slate-400 mb-2">
              Drag vertices to match your warehouse layout. Double-click to add new vertices.
            </p>
            <div className="h-[320px]">
              <PolygonEditor
                vertices={vertices}
                dimensions={dimensions}
                onChange={setVertices}
              />
            </div>
          </div>

          <button
            onClick={handleSaveBoundary}
            disabled={saving || vertices.length < 3}
            className="btn-primary w-full"
          >
            {saving ? 'Saving...' : 'Save & Continue to Scan'}
          </button>
        </div>
      )}

      {/* Step 2: Spatial scan */}
      {step === 'scan' && (
        <SpatialMapper
          warehouseId={warehouseId!}
          onPhotoTaken={handlePhotoTaken}
          photoCount={photoCount}
          requiredPhotos={8}
          onComplete={handleGenerateMap}
        />
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">
            <svg className="w-16 h-16 mx-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
          <p className="text-slate-400 mb-6">
            Your warehouse has been mapped. You can now add products and start navigating.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.href = `/app/warehouse/${warehouseId}/inventory`}
              className="btn-primary"
            >
              Add Products
            </button>
            <button
              onClick={() => window.location.href = `/app/warehouse/${warehouseId}`}
              className="btn-secondary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
