import { create } from 'zustand';
import type { ARScene, ARModel, Vector3 } from '@shared/types';

interface ARState {
  scenes: ARScene[];
  currentScene: ARScene | null;
  selectedModelId: string | null;
  isARActive: boolean;
  isLoading: boolean;

  setScenes: (scenes: ARScene[]) => void;
  setCurrentScene: (scene: ARScene | null) => void;
  selectModel: (modelId: string | null) => void;
  setARActive: (active: boolean) => void;
  setLoading: (loading: boolean) => void;

  addModelToScene: (model: ARModel) => void;
  updateModelTransform: (
    modelId: string,
    transform: { position?: Vector3; rotation?: Vector3; scale?: Vector3 },
  ) => void;
  removeModelFromScene: (modelId: string) => void;
}

export const useARStore = create<ARState>((set) => ({
  scenes: [],
  currentScene: null,
  selectedModelId: null,
  isARActive: false,
  isLoading: false,

  setScenes: (scenes) => set({ scenes }),
  setCurrentScene: (scene) => set({ currentScene: scene }),
  selectModel: (modelId) => set({ selectedModelId: modelId }),
  setARActive: (active) => set({ isARActive: active }),
  setLoading: (loading) => set({ isLoading: loading }),

  addModelToScene: (model) =>
    set((state) => {
      if (!state.currentScene) return state;
      return {
        currentScene: {
          ...state.currentScene,
          models: [...state.currentScene.models, model],
        },
      };
    }),

  updateModelTransform: (modelId, transform) =>
    set((state) => {
      if (!state.currentScene) return state;
      return {
        currentScene: {
          ...state.currentScene,
          models: state.currentScene.models.map((m) =>
            m.id === modelId
              ? {
                  ...m,
                  ...(transform.position && { position: transform.position }),
                  ...(transform.rotation && { rotation: transform.rotation }),
                  ...(transform.scale && { scale: transform.scale }),
                }
              : m,
          ),
        },
      };
    }),

  removeModelFromScene: (modelId) =>
    set((state) => {
      if (!state.currentScene) return state;
      return {
        currentScene: {
          ...state.currentScene,
          models: state.currentScene.models.filter((m) => m.id !== modelId),
        },
      };
    }),
}));
