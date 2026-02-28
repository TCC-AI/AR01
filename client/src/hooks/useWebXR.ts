import { useState, useEffect, useCallback } from 'react';

export type XRSessionMode = 'immersive-ar' | 'inline';

interface WebXRSupport {
  isSupported: boolean;
  isSessionActive: boolean;
  error: string | null;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  session: XRSession | null;
}

export function useWebXR(mode: XRSessionMode = 'immersive-ar'): WebXRSupport {
  const [isSupported, setIsSupported] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [session, setSession] = useState<XRSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSupport() {
      if (!navigator.xr) {
        setError('WebXR is not supported in this browser');
        setIsSupported(false);
        return;
      }

      try {
        const supported = await navigator.xr.isSessionSupported(mode);
        setIsSupported(supported);
        if (!supported) {
          setError(`${mode} is not supported on this device`);
        }
      } catch (err) {
        setError('Failed to check WebXR support');
        setIsSupported(false);
      }
    }

    checkSupport();
  }, [mode]);

  const startSession = useCallback(async () => {
    if (!navigator.xr) {
      setError('WebXR is not available');
      return;
    }

    try {
      const xrSession = await navigator.xr.requestSession(mode, {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['dom-overlay', 'light-estimation'],
      });

      xrSession.addEventListener('end', () => {
        setIsSessionActive(false);
        setSession(null);
      });

      setSession(xrSession);
      setIsSessionActive(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start AR session',
      );
    }
  }, [mode]);

  const endSession = useCallback(async () => {
    if (session) {
      await session.end();
      setSession(null);
      setIsSessionActive(false);
    }
  }, [session]);

  return {
    isSupported,
    isSessionActive,
    error,
    startSession,
    endSession,
    session,
  };
}
