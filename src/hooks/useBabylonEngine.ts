import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { EngineManager } from '@engine/babylon/EngineManager';
import { useViewerStore } from '@store/viewerStore';

/**
 * Mounts a single EngineManager on the given canvas for the lifetime of the
 * component. Returns a ref (not state) so callers can imperatively reach the
 * engine without re-rendering on every internal Babylon change.
 *
 * Guards against React StrictMode's mount→unmount→mount double-invoke: if the
 * effect is torn down before the async `initialize()` resolves, the engine
 * that was mid-construction is disposed immediately instead of leaking.
 */
export function useBabylonEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  onReady?: (engineManager: EngineManager) => void,
) {
  const engineManagerRef = useRef<EngineManager | null>(null);
  const setEngineReady = useViewerStore((state) => state.setEngineReady);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isCancelled = false;
    const manager = new EngineManager(canvas);

    manager.initialize().then(() => {
      if (isCancelled) {
        manager.dispose();
        return;
      }
      engineManagerRef.current = manager;
      manager.startRenderLoop();
      setEngineReady(true);
      onReadyRef.current?.(manager);
    });

    return () => {
      isCancelled = true;
      setEngineReady(false);
      if (engineManagerRef.current === manager) {
        manager.dispose();
        engineManagerRef.current = null;
      }
    };
  }, [canvasRef, setEngineReady]);

  return engineManagerRef;
}
