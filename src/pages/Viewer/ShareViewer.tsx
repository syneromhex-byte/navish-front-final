import { useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BabylonCanvas } from '@components/editor/BabylonCanvas';
import { Dropdown, Loader, buttonClasses } from '@components/common';
import type { EngineManager } from '@engine/babylon/EngineManager';
import type { CameraMode } from '@app-types/viewer.types';
import { ROUTES } from '@constants/routes';
import { BRAND_NAME } from '@constants/brand';
import { projectApi } from '@services/projectApi';
import { autoCategorizeModel } from '@engine/babylon/autoCategorizeModel';
import { getApiErrorMessage } from '@utils/apiError';

const CAMERA_MODES: { value: CameraMode; label: string }[] = [
  { value: 'orbit', label: 'Orbit' },
  { value: 'walk', label: 'Walk' },
  { value: 'fly', label: 'Fly' },
];

export default function ShareViewer() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const engineManagerRef = useRef<EngineManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit');

  const handleReady = useCallback(
    async (engineManager: EngineManager) => {
      engineManagerRef.current = engineManager;

      if (!shareToken) {
        setError('No share link token was provided.');
        return;
      }

      try {
        const project = await projectApi.getByShareToken(shareToken);
        if (!project || !project.modelUrl) {
          setError('No 3D model file has been uploaded for this shared project yet.');
          return;
        }

        const metadata = await engineManager.modelLoader.loadFromUrl(project.modelUrl);
        const root = engineManager.modelLoader.getRoot(metadata.rootId);
        if (root) {
          const { center, radius } = autoCategorizeModel(engineManager, root);
          engineManager.cameraManager.frameBounds(center, radius);
          engineManager.environmentManager.refreshReflections();
        }

        engineManager.optimizationManager.startAutoOptimize(60);
        setIsReady(true);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load the shared 3D model from the server.'));
      }
    },
    [shareToken],
  );

  const handleCameraModeChange = useCallback((mode: CameraMode) => {
    engineManagerRef.current?.cameraManager.setMode(mode);
    setCameraMode(mode);
  }, []);

  return (
    <div className="relative h-full w-full">
      <BabylonCanvas onReady={handleReady} />

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-0 p-6 text-center">
          <p className="text-lg font-medium text-text-primary">{error}</p>
          <p className="mt-2 text-sm text-text-secondary">Please contact your architect to request a new link.</p>
          <Link to={ROUTES.home} className="mt-6 font-medium text-primary hover:text-primary-hover">
            Return Home
          </Link>
        </div>
      ) : !isReady ? (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-0">
          <Loader size="lg" label="Loading space…" />
        </div>
      ) : null}

      <div className="glass-panel absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl p-1.5">
        <Dropdown
          trigger={
            <button
              type="button"
              className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-white/[0.08] hover:text-text-primary"
            >
              {CAMERA_MODES.find((mode) => mode.value === cameraMode)?.label}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          }
          placement="top"
          items={CAMERA_MODES.map((mode) => ({ value: mode.value, label: mode.label }))}
          onSelect={(value) => handleCameraModeChange(value as CameraMode)}
        />
      </div>

      <Link
        to={ROUTES.home}
        className="glass-panel absolute left-4 top-4 rounded-xl px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        Powered by{' '}
        <span className="font-display font-semibold text-text-primary">{BRAND_NAME}</span>
      </Link>

      <Link
        to={ROUTES.register}
        className={buttonClasses('primary', 'sm', 'absolute right-4 top-4')}
      >
        Create your own
      </Link>

      {shareToken && (
        <span className="sr-only" data-share-token={shareToken}>
          Viewing shared project
        </span>
      )}
    </div>
  );
}
