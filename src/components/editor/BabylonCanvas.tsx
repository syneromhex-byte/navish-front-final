import { useRef } from 'react';
import type { EngineManager } from '@engine/babylon/EngineManager';
import { useBabylonEngine } from '@hooks/useBabylonEngine';
import { cn } from '@utils/cn';

export interface BabylonCanvasProps {
  onReady?: (engineManager: EngineManager) => void;
  className?: string;
}

/**
 * Owns the <canvas> element and the single EngineManager instance mounted on
 * it. Purely a mount point — scene content (models, demo geometry) is the
 * caller's responsibility via `onReady`.
 */
export function BabylonCanvas({ onReady, className }: BabylonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useBabylonEngine(canvasRef, onReady);

  return (
    <canvas
      ref={canvasRef}
      className={cn('h-full w-full outline-none', className)}
      aria-label="3D model viewer"
    />
  );
}
