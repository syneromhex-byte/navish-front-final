import { useCallback, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BabylonCanvas } from '@components/editor/BabylonCanvas';
import { VRControls } from '@components/editor/VRControls/VRControls';
import { Loader } from '@components/common';
import type { EngineManager } from '@engine/babylon/EngineManager';
import { useProjectStore } from '@store/projectStore';
import { useLocalModelStore } from '@store/localModelStore';
import { loadProjectScene } from './loadProjectScene';

export default function VRPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useProjectStore((state) => state.projects.find((p) => p.id === projectId));
  const pendingLocalModel = useLocalModelStore((state) => state.pending);
  const engineManagerRef = useRef<EngineManager | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isInVR, setIsInVR] = useState(false);
  const [teleportEnabled, setTeleportEnabled] = useState(true);
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  const handleReady = useCallback(
    (engineManager: EngineManager) => {
      engineManagerRef.current = engineManager;
      engineManager.optimizationManager.startAutoOptimize(72);

      const matchingLocalModel =
        pendingLocalModel && pendingLocalModel.projectId === projectId
          ? pendingLocalModel
          : undefined;
      const localFile = matchingLocalModel?.file;

      loadProjectScene(engineManager, project, localFile, matchingLocalModel?.siblingFiles)
        .then(({ error }) => {
          setModelError(error);
          const floorMeshes = engineManager.objectManager
            .getAll()
            .filter((entry) => entry.category === 'floor')
            .map((entry) => entry.mesh);

          return engineManager.vrManager.initialize(floorMeshes);
        })
        .then((supported) => {
          setIsSupported(supported);
          if (supported) {
            engineManager.vrManager.onVRStateChange(setIsInVR);
          }
        })
        .finally(() => setIsCheckingSupport(false));
    },
    [project, projectId, pendingLocalModel],
  );

  const handleEnterVR = useCallback(() => {
    engineManagerRef.current?.vrManager.enterVR();
  }, []);

  const handleExitVR = useCallback(() => {
    engineManagerRef.current?.vrManager.exitVR();
  }, []);

  const handleTeleportToggle = useCallback((enabled: boolean) => {
    setTeleportEnabled(enabled);
    engineManagerRef.current?.vrManager.setTeleportationEnabled(enabled);
  }, []);

  return (
    <div className="relative h-full w-full">
      <BabylonCanvas onReady={handleReady} />

      {modelError && (
        <div className="glass-panel absolute left-1/2 top-4 max-w-md -translate-x-1/2 rounded-xl px-4 py-3 text-center text-sm text-primary">
          Could not load this model — {modelError}
        </div>
      )}

      {isCheckingSupport ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader label="Checking VR support…" />
        </div>
      ) : (
        <VRControls
          isSupported={isSupported}
          isInVR={isInVR}
          teleportEnabled={teleportEnabled}
          onEnterVR={handleEnterVR}
          onExitVR={handleExitVR}
          onTeleportToggle={handleTeleportToggle}
        />
      )}
    </div>
  );
}
