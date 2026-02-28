import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Grid } from '@react-three/drei';
import { ARScene } from './ARScene';
import { useARStore } from '../../stores/arStore';
import { scenesApi, uploadApi } from '../../services/api';
import type { ARScene as ARSceneType, ARModel } from '@shared/types';

export default function SceneEditor() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const navigate = useNavigate();
  const { currentScene, setCurrentScene, addModelToScene, selectedModelId, removeModelFromScene } =
    useARStore();
  const [saving, setSaving] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);

  useEffect(() => {
    async function loadScene() {
      if (!sceneId) return;
      try {
        const response = await scenesApi.get(sceneId);
        if (response.success && response.data) {
          setCurrentScene(response.data);
        }
      } catch {
        navigate('/app');
      }
    }
    loadScene();
  }, [sceneId, setCurrentScene, navigate]);

  const handleSave = useCallback(async () => {
    if (!currentScene) return;
    setSaving(true);
    try {
      await scenesApi.update(currentScene.id, currentScene);
    } finally {
      setSaving(false);
    }
  }, [currentScene]);

  const handleAddModel = useCallback(async () => {
    const newModel: ARModel = {
      id: crypto.randomUUID(),
      name: `Model ${(currentScene?.models.length ?? 0) + 1}`,
      url: '',
      format: 'glb',
      position: { x: 0, y: 0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };
    addModelToScene(newModel);
    setShowAddModel(false);
  }, [currentScene, addModelToScene]);

  const handleUploadModel = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const response = await uploadApi.model(file);
      if (response.success && response.data) {
        const newModel: ARModel = {
          id: crypto.randomUUID(),
          name: response.data.name,
          url: response.data.url,
          format: 'glb',
          position: { x: 0, y: 0.5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        };
        addModelToScene(newModel);
      }
      setShowAddModel(false);
    },
    [addModelToScene],
  );

  if (!currentScene) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div>
          <h1 className="text-lg font-bold">{currentScene.name}</h1>
          <p className="text-sm text-slate-400">
            {currentScene.models.length} model(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/ar/${currentScene.id}`)}
            className="btn-secondary text-sm px-4 py-2"
          >
            Preview AR
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-sm px-4 py-2"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 3D Viewport */}
        <div className="flex-1">
          <Canvas camera={{ position: [3, 3, 3], fov: 60 }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
            <Environment preset="studio" />
            <Grid infiniteGrid fadeDistance={30} />
            <ARScene scene={currentScene} />
            <OrbitControls makeDefault enableDamping />
          </Canvas>
        </div>

        {/* Side panel */}
        <div className="w-72 border-l border-slate-700 overflow-y-auto p-4 space-y-4 hidden md:block">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Models</h3>
            <button
              onClick={() => setShowAddModel(!showAddModel)}
              className="text-primary-400 hover:text-primary-300 text-sm"
            >
              + Add
            </button>
          </div>

          {showAddModel && (
            <div className="card space-y-2">
              <button onClick={handleAddModel} className="btn-secondary w-full text-sm py-2">
                Add Placeholder
              </button>
              <label className="btn-primary w-full text-sm py-2 text-center cursor-pointer block">
                Upload 3D Model
                <input
                  type="file"
                  accept=".glb,.gltf,.obj,.fbx"
                  onChange={handleUploadModel}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Model list */}
          {currentScene.models.map((model) => (
            <div
              key={model.id}
              className={`card cursor-pointer transition-colors ${
                selectedModelId === model.id
                  ? 'border-primary-500 bg-primary-950/50'
                  : 'hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">
                  {model.name}
                </span>
                <button
                  onClick={() => removeModelFromScene(model.id)}
                  className="text-slate-400 hover:text-red-400 text-xs"
                >
                  Delete
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-400 space-y-1">
                <div>
                  Pos: {model.position.x.toFixed(1)}, {model.position.y.toFixed(1)},{' '}
                  {model.position.z.toFixed(1)}
                </div>
                <div>Format: {model.format}</div>
              </div>
            </div>
          ))}

          {currentScene.models.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">
              No models yet. Add one to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
