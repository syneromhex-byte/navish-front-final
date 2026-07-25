import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BabylonCanvas } from '@components/editor/BabylonCanvas';
import { Toolbar } from '@components/editor/Toolbar/Toolbar';
import { ObjectPanel } from '@components/editor/ObjectPanel/ObjectPanel';
import type { ObjectPanelEntry } from '@components/editor/ObjectPanel/ObjectPanel';
import { MaterialPanel } from '@components/editor/MaterialPanel/MaterialPanel';
import { TexturePanel } from '@components/editor/TexturePanel/TexturePanel';
import { TransformPanel } from '@components/editor/TransformPanel/TransformPanel';
import { LightingPanel } from '@components/editor/LightingPanel/LightingPanel';
import { EnvironmentPanel } from '@components/editor/EnvironmentPanel/EnvironmentPanel';
import { CameraControls } from '@components/editor/CameraControls/CameraControls';
import { Tabs, Loader } from '@components/common';
import { projectApi } from '@services/projectApi';
import type { EngineManager } from '@engine/babylon/EngineManager';
import type { MaterialProperties } from '@engine/babylon/MaterialManager';
import type { TransformValues } from '@engine/babylon/TransformManager';
import type { ShadowQuality } from '@engine/babylon/LightManager';
import { GyroscopeManager } from '@engine/babylon/GyroscopeManager';
import { GeoWalkManager } from '@engine/babylon/GeoWalkManager';
import type { GeoWalkStatus } from '@engine/babylon/GeoWalkManager';
import { useEditorStore } from '@store/editorStore';
import { useViewerStore } from '@store/viewerStore';
import { useProjectStore } from '@store/projectStore';
import { usePortfolioStore } from '@store/portfolioStore';
import { useLocalModelStore } from '@store/localModelStore';
import { ROUTES } from '@constants/routes';
import type { EngineStats } from '@app-types/viewer.types';
import type { Project } from '@app-types/project.types';
import { loadProjectScene } from './loadProjectScene';

export default function ViewerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [isSceneLoading, setIsSceneLoading] = useState(true);
  const [engineManager, setEngineManager] = useState<EngineManager | null>(null);

  const pendingLocalModel = useLocalModelStore((state) => state.pending);
  const engineManagerRef = useRef<EngineManager | null>(null);
  const [stats, setStats] = useState<EngineStats>({ fps: 0, drawCalls: 0, activeMeshes: 0 });
  const [objects, setObjects] = useState<ObjectPanelEntry[]>([]);
  const [modelError, setModelError] = useState<string | null>(null);
  const [materialProperties, setMaterialProperties] = useState<MaterialProperties | null>(null);
  const [hasTexture, setHasTexture] = useState(false);
  const [transformValues, setTransformValues] = useState<TransformValues | null>(null);

  const [sunAzimuth, setSunAzimuth] = useState(225);
  const [sunElevation, setSunElevation] = useState(50);
  const [sunIntensity, setSunIntensity] = useState(2.2);
  const [ambientIntensity, setAmbientIntensity] = useState(0.6);
  const [exposure, setExposure] = useState(1);
  const [shadowQuality, setShadowQuality] = useState<ShadowQuality>('medium');
  const [turbidity, setTurbidity] = useState(10);
  const [luminance, setLuminance] = useState(1);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [fogDensity, setFogDensity] = useState(0.01);
  const [isGyroActive, setIsGyroActive] = useState(false);
  const [gyroSensitivity, setGyroSensitivity] = useState(1);
  const [geoWalkStatus, setGeoWalkStatus] = useState<GeoWalkStatus | null>(null);
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState(false);

  const toolMode = useEditorStore((state) => state.toolMode);
  const setToolMode = useEditorStore((state) => state.setToolMode);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const setSelectedIds = useEditorStore((state) => state.setSelectedIds);
  const cameraMode = useViewerStore((state) => state.cameraMode);
  const setCameraMode = useViewerStore((state) => state.setCameraMode);

  const selectedId = selectedIds[0];

  useEffect(() => {
    if (!selectedId) setTransformValues(null);
  }, [selectedId]);

  // Motion look only makes sense for cameras you can freely rotate — turn it
  // off automatically if the user switches to an orbit-style mode.
  useEffect(() => {
    if ((cameraMode === 'orbit' || cameraMode === 'cinematic') && isGyroActive) {
      setIsGyroActive(false);
    }
  }, [cameraMode, isGyroActive]);

  // GPS walk is only meaningful for freely-moving cameras too, but disabling
  // it is an imperative call into the engine (not a setState), so it belongs
  // in an effect rather than the render-time block above.
  useEffect(() => {
    if (cameraMode === 'orbit' || cameraMode === 'cinematic') {
      engineManagerRef.current?.geoWalkManager.disable();
    }
  }, [cameraMode]);

  // Fetch project from API on mount
  useEffect(() => {
    if (!projectId) return;
    setIsSceneLoading(true);

    if (projectId.startsWith('port_')) {
      const pItem = usePortfolioStore.getState().items.find((i) => i.id === projectId);
      if (pItem) {
        setProject({
          id: pItem.id,
          name: pItem.title,
          modelUrl: pItem.modelUrl,
          status: 'APPROVED',
          sizeBytes: pItem.sizeBytes,
          clientName: 'Portfolio Item',
        } as unknown as Project);
      } else {
        setModelError('Portfolio item not found.');
      }
      return;
    }

    projectApi
      .get(projectId)
      .then((data) => {
        if (data.modelUrl?.includes('example.com') || data.modelUrl?.startsWith('blob:')) {
          data.modelUrl = undefined;
        }
        setProject(data);
        useProjectStore.getState().updateProject(projectId, data);
      })
      .catch((err) => {
        console.error('Failed to load project from API', err);
        const localProj = useProjectStore.getState().projects.find((p) => p.id === projectId);
        setProject(localProj);
      });
  }, [projectId]);

  // Load project scene once project data AND engine manager are ready
  useEffect(() => {
    if (!engineManager) return;

    const matchingLocalModel =
      pendingLocalModel && pendingLocalModel.projectId === projectId
        ? pendingLocalModel
        : undefined;
    const localFile = matchingLocalModel?.file;

    if (!localFile && !project) return;

    setIsSceneLoading(true);
    loadProjectScene(
      engineManager,
      project,
      localFile,
      matchingLocalModel?.siblingFiles,
    ).then(({ entries, error }) => {
      setObjects(entries);
      setModelError(error);
      setIsSceneLoading(false);
    });
  }, [engineManager, project, projectId, pendingLocalModel]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadModelDirectly = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !engineManager || !projectId) return;

    setIsSceneLoading(true);
    setModelError(null);
    setIsUploading(true);

    try {
      const { entries, error } = await loadProjectScene(engineManager, project, file);
      if (error) {
        setModelError(error);
      } else {
        setObjects(entries);
      }

      const uploaded = await projectApi.uploadModel(file);
      if (uploaded && uploaded.modelUrl) {
        await projectApi.update(projectId, {
          modelUrl: uploaded.modelUrl,
          status: 'ready',
        });
        setProject((prev) => (prev ? { ...prev, modelUrl: uploaded.modelUrl } : prev));
      }
    } catch (err: any) {
      console.error('Direct model upload failed:', err);
    } finally {
      setIsSceneLoading(false);
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleReady = useCallback(
    (em: EngineManager) => {
      engineManagerRef.current = em;
      setEngineManager(em);

      em.selectionManager.onSelectionChange(setSelectedIds);
      em.optimizationManager.startAutoOptimize(60);
      em.geoWalkManager.onChange(setGeoWalkStatus);

      const canvas = em.getEngine().getRenderingCanvas();
      if (canvas) em.gyroscopeManager.enableOrbitAutoLook(canvas);
    },
    [setSelectedIds],
  );

  const handleSelectFromPanel = useCallback((id: string) => {
    const engineManager = engineManagerRef.current;
    const mesh = engineManager?.objectManager.getMesh(id);
    if (engineManager && mesh) {
      engineManager.selectionManager.select(id, mesh);
    }
  }, []);

  const handleCameraModeChange = useCallback(
    (mode: typeof cameraMode) => {
      engineManagerRef.current?.cameraManager.setMode(mode);
      setCameraMode(mode);
    },
    [setCameraMode],
  );

  // Sync the material/texture panels whenever the live selection changes.
  useEffect(() => {
    const engineManager = engineManagerRef.current;
    if (!engineManager || !selectedId) {
      setMaterialProperties(null);
      setHasTexture(false);
      return;
    }
    const mesh = engineManager.objectManager.getMesh(selectedId);
    if (!mesh) {
      setMaterialProperties(null);
      setHasTexture(false);
      return;
    }
    setMaterialProperties(engineManager.materialManager.getProperties(mesh));
    const mat = mesh.material as any;
    setHasTexture(mat ? !!(mat.albedoTexture || mat.diffuseTexture) : false);
  }, [selectedId]);

  const handleMaterialChange = useCallback(
    (update: Partial<MaterialProperties>) => {
      const engineManager = engineManagerRef.current;
      const mesh = selectedId ? engineManager?.objectManager.getMesh(selectedId) : undefined;
      if (!engineManager || !mesh) return;
      engineManager.materialManager.updateProperties(mesh, update);
      setMaterialProperties((prev) => (prev ? { ...prev, ...update } : prev));
    },
    [selectedId],
  );

  const handleApplyTexture = useCallback(
    (kind: Parameters<EngineManager['textureManager']['createProceduralTexture']>[0]) => {
      const engineManager = engineManagerRef.current;
      const mesh = selectedId ? engineManager?.objectManager.getMesh(selectedId) : undefined;
      if (!engineManager || !mesh) return;
      const texture = engineManager.textureManager.createProceduralTexture(kind);
      engineManager.materialManager.applyTexture(mesh, 'albedo', texture);
      setHasTexture(true);
      setMaterialProperties(engineManager.materialManager.getProperties(mesh));
    },
    [selectedId],
  );

  const handleClearTexture = useCallback(() => {
    const engineManager = engineManagerRef.current;
    const mesh = selectedId ? engineManager?.objectManager.getMesh(selectedId) : undefined;
    if (!engineManager || !mesh) return;
    engineManager.materialManager.applyTexture(mesh, 'albedo', null);
    setHasTexture(false);
  }, [selectedId]);

  // Attach/detach the transform gizmo whenever the selection or active tool changes.
  useEffect(() => {
    const engineManager = engineManagerRef.current;
    if (!engineManager) return;
    engineManager.transformManager.setToolMode(toolMode);
    const mesh = selectedId ? engineManager.objectManager.getMesh(selectedId) : undefined;
    engineManager.transformManager.attachToMesh(mesh ?? null);
  }, [selectedId, toolMode]);

  // Gizmo drags mutate the mesh continuously — poll while something is selected
  // so the numeric panel stays live without wiring per-axis drag observables.
  useEffect(() => {
    if (!selectedId) return;
    const interval = window.setInterval(() => {
      const engineManager = engineManagerRef.current;
      const mesh = engineManager?.objectManager.getMesh(selectedId);
      if (engineManager && mesh) {
        setTransformValues(engineManager.transformManager.getTransform(mesh));
      }
    }, 150);
    return () => window.clearInterval(interval);
  }, [selectedId]);

  const handlePositionChange = useCallback(
    (axis: 'x' | 'y' | 'z', value: number) => {
      const engineManager = engineManagerRef.current;
      const mesh = selectedId ? engineManager?.objectManager.getMesh(selectedId) : undefined;
      if (!engineManager || !mesh) return;
      engineManager.transformManager.setPositionAxis(mesh, axis, value);
      setTransformValues(engineManager.transformManager.getTransform(mesh));
    },
    [selectedId],
  );

  const handleRotationChange = useCallback(
    (axis: 'x' | 'y' | 'z', value: number) => {
      const engineManager = engineManagerRef.current;
      const mesh = selectedId ? engineManager?.objectManager.getMesh(selectedId) : undefined;
      if (!engineManager || !mesh) return;
      engineManager.transformManager.setRotationAxisDegrees(mesh, axis, value);
      setTransformValues(engineManager.transformManager.getTransform(mesh));
    },
    [selectedId],
  );

  const handleScaleChange = useCallback(
    (axis: 'x' | 'y' | 'z', value: number) => {
      const engineManager = engineManagerRef.current;
      const mesh = selectedId ? engineManager?.objectManager.getMesh(selectedId) : undefined;
      if (!engineManager || !mesh) return;
      engineManager.transformManager.setScaleAxis(mesh, axis, value);
      setTransformValues(engineManager.transformManager.getTransform(mesh));
    },
    [selectedId],
  );

  const syncSunToSky = useCallback(() => {
    const engineManager = engineManagerRef.current;
    if (!engineManager) return;
    engineManager.environmentManager.syncSunDirection(
      engineManager.lightManager.getSunLight().direction,
    );
  }, []);

  const handleSunAzimuthChange = useCallback(
    (value: number) => {
      setSunAzimuth(value);
      engineManagerRef.current?.lightManager.setSunPosition(value, sunElevation);
      syncSunToSky();
    },
    [sunElevation, syncSunToSky],
  );

  const handleSunElevationChange = useCallback(
    (value: number) => {
      setSunElevation(value);
      engineManagerRef.current?.lightManager.setSunPosition(sunAzimuth, value);
      syncSunToSky();
    },
    [sunAzimuth, syncSunToSky],
  );

  const handleSunIntensityChange = useCallback((value: number) => {
    setSunIntensity(value);
    engineManagerRef.current?.lightManager.setSunIntensity(value);
  }, []);

  const handleAmbientIntensityChange = useCallback((value: number) => {
    setAmbientIntensity(value);
    engineManagerRef.current?.lightManager.setAmbientIntensity(value);
  }, []);

  const handleExposureChange = useCallback((value: number) => {
    setExposure(value);
    engineManagerRef.current?.sceneManager.setExposure(value);
  }, []);

  const handleShadowQualityChange = useCallback((quality: ShadowQuality) => {
    setShadowQuality(quality);
    engineManagerRef.current?.lightManager.setShadowQuality(quality);
  }, []);

  const handleTurbidityChange = useCallback((value: number) => {
    setTurbidity(value);
    engineManagerRef.current?.environmentManager.setTurbidity(value);
  }, []);

  const handleLuminanceChange = useCallback((value: number) => {
    setLuminance(value);
    engineManagerRef.current?.environmentManager.setLuminance(value);
  }, []);

  const handleFogToggle = useCallback((enabled: boolean) => {
    setFogEnabled(enabled);
    engineManagerRef.current?.environmentManager.setFogMode(enabled ? 'exponential' : 'off');
  }, []);

  const handleFogDensityChange = useCallback((value: number) => {
    setFogDensity(value);
    engineManagerRef.current?.environmentManager.setFogDensity(value);
  }, []);

  const handleToggleGyro = useCallback(async () => {
    if (isGyroActive) {
      setIsGyroActive(false);
      return;
    }
    const granted = await GyroscopeManager.requestPermission();
    if (!granted) return;
    engineManagerRef.current?.gyroscopeManager.calibrate();
    setIsGyroActive(true);
  }, [isGyroActive]);

  // Single source of truth for enabling/disabling the engine-side listener —
  // fires whether the user toggled it manually or the camera-mode guard
  // above turned it off.
  useEffect(() => {
    const engineManager = engineManagerRef.current;
    if (!engineManager) return;
    if (isGyroActive) {
      engineManager.gyroscopeManager.enable();
    } else {
      engineManager.gyroscopeManager.disable();
    }
  }, [isGyroActive]);

  const handleCalibrateGyro = useCallback(() => {
    engineManagerRef.current?.gyroscopeManager.calibrate();
  }, []);

  const handleGyroSensitivityChange = useCallback((value: number) => {
    setGyroSensitivity(value);
    engineManagerRef.current?.gyroscopeManager.setSensitivity(value);
  }, []);

  const handleToggleGeoWalk = useCallback(() => {
    const engineManager = engineManagerRef.current;
    if (!engineManager) return;
    if (engineManager.geoWalkManager.getStatus().isEnabled) {
      engineManager.geoWalkManager.disable();
    } else {
      void engineManager.geoWalkManager.enable();
    }
  }, []);

  const handleRecalibrateGeoWalk = useCallback(() => {
    engineManagerRef.current?.geoWalkManager.calibrate();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const engineManager = engineManagerRef.current;
      if (engineManager) setStats(engineManager.optimizationManager.getStats());
    }, 500);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.obj,.fbx"
        className="hidden"
        onChange={handleUploadModelDirectly}
      />

      <BabylonCanvas onReady={handleReady} />

      {isSceneLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-0/80 backdrop-blur-sm z-50">
          <Loader size="lg" label="Loading 3D model..." />
        </div>
      )}

      {!isSceneLoading && !project?.modelUrl && objects.length === 0 && !modelError && (
        <div className="glass-panel absolute left-1/2 top-1/2 z-50 flex max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3.5 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md border border-white/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">No 3D Model Attached</h3>
            <p className="mt-1 text-xs text-text-secondary">Upload a .glb, .gltf, .fbx, or .obj file to view and interact in 3D</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-1 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload 3D Model'}
          </button>
        </div>
      )}

      {modelError && (
        <div className="glass-panel absolute left-1/2 top-4 z-50 flex max-w-md -translate-x-1/2 flex-col items-center gap-2.5 rounded-xl px-5 py-4 text-center text-sm shadow-xl">
          <p className="font-medium text-primary">{modelError}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isUploading ? 'Uploading Model...' : 'Upload 3D Model (.glb, .fbx, .obj)'}
          </button>
        </div>
      )}

      <ObjectPanel objects={objects} selectedIds={selectedIds} onSelect={handleSelectFromPanel} />

      <div className="glass-panel scrollbar-thin absolute right-4 top-4 max-h-[calc(100%-2rem)] w-72 overflow-y-auto rounded-2xl">
        <Tabs
          className="p-1"
          items={[
            {
              value: 'material',
              label: 'Material',
              content: (
                <MaterialPanel properties={materialProperties} onChange={handleMaterialChange} />
              ),
            },
            {
              value: 'texture',
              label: 'Texture',
              content: (
                <TexturePanel
                  isEnabled={!!materialProperties}
                  hasTexture={hasTexture}
                  onApply={handleApplyTexture}
                  onClear={handleClearTexture}
                />
              ),
            },
            {
              value: 'transform',
              label: 'Transform',
              content: (
                <TransformPanel
                  values={transformValues}
                  onPositionChange={handlePositionChange}
                  onRotationChange={handleRotationChange}
                  onScaleChange={handleScaleChange}
                />
              ),
            },
            {
              value: 'lighting',
              label: 'Lighting',
              content: (
                <LightingPanel
                  sunAzimuth={sunAzimuth}
                  sunElevation={sunElevation}
                  sunIntensity={sunIntensity}
                  ambientIntensity={ambientIntensity}
                  exposure={exposure}
                  shadowQuality={shadowQuality}
                  onSunAzimuthChange={handleSunAzimuthChange}
                  onSunElevationChange={handleSunElevationChange}
                  onSunIntensityChange={handleSunIntensityChange}
                  onAmbientIntensityChange={handleAmbientIntensityChange}
                  onExposureChange={handleExposureChange}
                  onShadowQualityChange={handleShadowQualityChange}
                />
              ),
            },
            {
              value: 'environment',
              label: 'Environment',
              content: (
                <EnvironmentPanel
                  turbidity={turbidity}
                  luminance={luminance}
                  fogEnabled={fogEnabled}
                  fogDensity={fogDensity}
                  onTurbidityChange={handleTurbidityChange}
                  onLuminanceChange={handleLuminanceChange}
                  onFogToggle={handleFogToggle}
                  onFogDensityChange={handleFogDensityChange}
                />
              ),
            },
          ]}
        />
      </div>

      <Toolbar
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        cameraMode={cameraMode}
        onCameraModeChange={handleCameraModeChange}
        onCameraDropdownOpenChange={setIsCameraDropdownOpen}
        vrHref={projectId ? ROUTES.viewerVr(projectId) : undefined}
      />

      {!isCameraDropdownOpen &&
        cameraMode !== 'orbit' &&
        cameraMode !== 'cinematic' &&
        (GyroscopeManager.isAvailable() || GeoWalkManager.isAvailable()) && (
          <CameraControls
            isGyroActive={isGyroActive}
            sensitivity={gyroSensitivity}
            onToggleGyro={handleToggleGyro}
            onCalibrate={handleCalibrateGyro}
            onSensitivityChange={handleGyroSensitivityChange}
            isGeoWalkAvailable={GeoWalkManager.isAvailable()}
            geoWalkStatus={geoWalkStatus}
            onToggleGeoWalk={handleToggleGeoWalk}
            onRecalibrateGeoWalk={handleRecalibrateGeoWalk}
          />
        )}

      <div className="glass-panel absolute bottom-4 right-4 z-30 rounded-lg px-3 py-2 text-xs text-text-secondary">
        <p className="tabular">{stats.fps} fps</p>
        <p className="tabular">{stats.drawCalls} draw calls</p>
        <p className="tabular">{stats.activeMeshes} active meshes</p>
      </div>
    </div>
  );
}
