import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { ARScene as ARSceneComponent } from './ARScene';
import { ARControls } from './ARControls';
import { useARStore } from '../../stores/arStore';
import { useWebXR } from '../../hooks/useWebXR';
import { scenesApi } from '../../services/api';
import type { ARScene } from '@shared/types';

export default function ARViewer() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const navigate = useNavigate();
  const { isSupported, error: xrError } = useWebXR();
  const { setCurrentScene, setARActive, isARActive } = useARStore();
  const [scene, setScene] = useState<ARScene | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadScene() {
      if (!sceneId) return;
      try {
        const response = await scenesApi.get(sceneId);
        if (response.success && response.data) {
          setScene(response.data);
          setCurrentScene(response.data);
        } else {
          setError(response.error || 'Failed to load scene');
        }
      } catch {
        setError('Network error loading scene');
      } finally {
        setLoading(false);
      }
    }
    loadScene();
  }, [sceneId, setCurrentScene]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading AR Scene...</p>
        </div>
      </div>
    );
  }

  if (error || !scene) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6">
        <div className="card text-center max-w-sm">
          <div className="text-4xl mb-4">!</div>
          <h2 className="text-xl font-bold mb-2">Unable to Load</h2>
          <p className="text-slate-400 mb-6">{error || 'Scene not found'}</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 75 }}
        style={{ background: isARActive ? 'transparent' : '#0f172a' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Environment preset="city" />
        <ARSceneComponent scene={scene} />
        {!isARActive && <OrbitControls enableDamping />}
      </Canvas>

      {/* AR Overlay UI */}
      <div className="ar-overlay">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 safe-area-top">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="glass rounded-full w-10 h-10 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="glass rounded-full px-4 py-2 text-sm font-medium">
              {scene.name}
            </div>
            <div className="w-10" />
          </div>
        </div>

        {/* XR support message */}
        {!isSupported && (
          <div className="absolute top-20 left-4 right-4">
            <div className="glass rounded-xl p-3 text-center text-sm text-yellow-300">
              {xrError || 'AR not available on this device. Showing 3D preview.'}
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <ARControls
          isARSupported={isSupported}
          isARActive={isARActive}
          onToggleAR={() => setARActive(!isARActive)}
        />
      </div>
    </div>
  );
}
