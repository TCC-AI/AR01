import { useState, useEffect, useCallback } from 'react';

interface DeviceOrientationData {
  alpha: number | null; // Z-axis rotation (0-360)
  beta: number | null; // X-axis rotation (-180 to 180)
  gamma: number | null; // Y-axis rotation (-90 to 90)
  isAvailable: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useDeviceOrientation(): DeviceOrientationData {
  const [orientation, setOrientation] = useState<DeviceOrientationData>({
    alpha: null,
    beta: null,
    gamma: null,
    isAvailable: false,
    requestPermission: async () => false,
  });

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    setOrientation((prev) => ({
      ...prev,
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
      isAvailable: true,
    }));
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    // iOS 13+ requires permission
    if (
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      try {
        const permission = await (
          DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    // Non-iOS or older iOS
    window.addEventListener('deviceorientation', handleOrientation);
    return true;
  }, [handleOrientation]);

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [handleOrientation]);

  return { ...orientation, requestPermission };
}
