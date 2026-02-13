import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { scenesApi } from '../../services/api';
import { useARStore } from '../../stores/arStore';
import { useAuthStore } from '../../stores/authStore';
import type { ARScene } from '@shared/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { scenes, setScenes } = useARStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');

  useEffect(() => {
    async function loadScenes() {
      try {
        const response = await scenesApi.list();
        if (response.success && response.data) {
          setScenes(response.data);
        }
      } catch {
        // Failed to load scenes
      } finally {
        setLoading(false);
      }
    }
    loadScenes();
  }, [setScenes]);

  const handleCreateScene = useCallback(async () => {
    if (!newSceneName.trim()) return;
    try {
      const response = await scenesApi.create({
        name: newSceneName,
        description: '',
        models: [],
        markers: [],
        isPublic: false,
      });
      if (response.success && response.data) {
        setScenes([...scenes, response.data]);
        setNewSceneName('');
        setShowCreate(false);
        navigate(`/app/scene/${response.data.id}`);
      }
    } catch {
      // Handle error
    }
  }, [newSceneName, scenes, setScenes, navigate]);

  const handleDeleteScene = useCallback(
    async (sceneId: string) => {
      try {
        await scenesApi.delete(sceneId);
        setScenes(scenes.filter((s) => s.id !== sceneId));
      } catch {
        // Handle error
      }
    },
    [scenes, setScenes],
  );

  const tierLimits = {
    free: 3,
    pro: Infinity,
    enterprise: Infinity,
  };

  const canCreateMore =
    scenes.length < (tierLimits[user?.subscription || 'free'] ?? 3);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My AR Scenes</h1>
          <p className="text-sm text-slate-400">
            {scenes.length} scene{scenes.length !== 1 ? 's' : ''}{' '}
            {user?.subscription === 'free' && `(${tierLimits.free} max)`}
          </p>
        </div>
        {canCreateMore && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary text-sm"
          >
            + New Scene
          </button>
        )}
      </div>

      {/* Create Scene Dialog */}
      {showCreate && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-3">Create New Scene</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              placeholder="Scene name"
              className="input flex-1"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateScene()}
            />
            <button onClick={handleCreateScene} className="btn-primary">
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Scene Grid */}
      {!loading && scenes.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">
            <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No scenes yet</h3>
          <p className="text-slate-400 mb-6">
            Create your first AR scene to get started.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            Create First Scene
          </button>
        </div>
      )}

      {!loading && scenes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              onEdit={() => navigate(`/app/scene/${scene.id}`)}
              onView={() => navigate(`/ar/${scene.id}`)}
              onDelete={() => handleDeleteScene(scene.id)}
            />
          ))}
        </div>
      )}

      {/* Upgrade prompt */}
      {!canCreateMore && (
        <div className="mt-8 card border-primary-500/30 text-center">
          <h3 className="font-semibold mb-2">Scene Limit Reached</h3>
          <p className="text-slate-400 text-sm mb-4">
            Upgrade to Pro for unlimited scenes and more features.
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

function SceneCard({
  scene,
  onEdit,
  onView,
  onDelete,
}: {
  scene: ARScene;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card group">
      {/* Thumbnail */}
      <div className="aspect-video bg-slate-700 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
        <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>

      {/* Info */}
      <h3 className="font-semibold truncate">{scene.name}</h3>
      <p className="text-xs text-slate-400 mt-1">
        {scene.models.length} model{scene.models.length !== 1 ? 's' : ''} |{' '}
        {scene.isPublic ? 'Public' : 'Private'}
      </p>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button onClick={onEdit} className="btn-secondary text-xs flex-1 py-2">
          Edit
        </button>
        <button onClick={onView} className="btn-primary text-xs flex-1 py-2">
          View AR
        </button>
        <button
          onClick={onDelete}
          className="text-xs px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
