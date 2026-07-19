import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PBRMaterial } from '@babylonjs/core';
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
import { Tabs } from '@components/common';
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
import { useLocalModelStore } from '@store/localModelStore';
import { ROUTES } from '@constants/routes';
import type { EngineStats } from '@app-types/viewer.types';
import { loadProjectScene } from './loadProjectScene';

export default function ViewerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useProjectStore((state) => state.projects.find((p) => p.id === projectId));
  const pendingLocalModel = useLocalModelStore((state) => state.pending);
  const engineManagerRef = useRef<EngineManager | null>(null);
  const [stats, setStats] = useState<EngineStats>({ fps: 0, drawCalls: 0, activeMeshes: 0 });
  const [objects, setObjects] = useState<ObjectPanelEntry[]>([]);
  const [modelError, setModelError] = useState<string | null>(null);
  const [materialProperties, setMaterialProperties] = useState<MaterialProperties | null>(null);
  const [hasTexture, setHasTexture] = useState(false);
  const [transformValues, setTransformValues] = useState<TransformValues | null>(null);
  const [lastTransformSelectedId, setLastTransformSelectedId] = useState<string | undefined>(
    undefined,
  );

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
  const [lastCameraModeForGyro, setLastCameraModeForGyro] = useState<typeof cameraMode | undefined>(
    undefined,
  );

  const toolMode = useEditorStore((state) => state.toolMode);
  const setToolMode = useEditorStore((state) => state.setToolMode);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const setSelectedIds = useEditorStore((state) => state.setSelectedIds);
  const cameraMode = useViewerStore((state) => state.cameraMode);
  const setCameraMode = useViewerStore((state) => state.setCameraMode);

  const selectedId = selectedIds[0];

  if (selectedId !== lastTransformSelectedId) {
    setLastTransformSelectedId(selectedId);
    if (!selectedId) setTransformValues(null);
  }

  // Motion look only makes sense for cameras you can freely rotate — turn it
  // off automatically if the user switches to an orbit-style mode.
  if (cameraMode !== lastCameraModeForGyro) {
    setLastCameraModeForGyro(cameraMode);
    if ((cameraMode === 'orbit' || cameraMode === 'cinematic') && isGyroActive) {
      setIsGyroActive(false);
    }
  }

  // GPS walk is only meaningful for freely-moving cameras too, but disabling
  // it is an imperative call into the engine (not a setState), so it belongs
  // in an effect rather than the render-time block above.
  useEffect(() => {
    if (cameraMode === 'orbit' || cameraMode === 'cinematic') {
      engineManagerRef.current?.geoWalkManager.disable();
    }
  }, [cameraMode]);

  const handleReady = useCallback(
    (engineManager: EngineManager) => {
      engineManagerRef.current = engineManager;
      engineManager.selectionManager.onSelectionChange(setSelectedIds);
      engineManager.optimizationManager.startAutoOptimize(60);
      engineManager.geoWalkManager.onChange(setGeoWalkStatus);

      const canvas = engineManager.getEngine().getRenderingCanvas();
      if (canvas) engineManager.gyroscopeManager.enableOrbitAutoLook(canvas);

      const matchingLocalModel =
        pendingLocalModel && pendingLocalModel.projectId === projectId
          ? pendingLocalModel
          : undefined;
      const localFile = matchingLocalModel?.file;

      loadProjectScene(
        engineManager,
        project,
        localFile,
        matchingLocalModel?.siblingFiles,
      ).then(({ entries, error }) => {
        setObjects(entries);
        setModelError(error);
      });
    },
    [setSelectedIds, project, projectId, pendingLocalModel],
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
    setHasTexture(
      mesh.material instanceof PBRMaterial ? mesh.material.albedoTexture !== null : false,
    );
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
      <BabylonCanvas onReady={handleReady} />

      {modelError && (
        <div className="glass-panel absolute left-1/2 top-4 max-w-md -translate-x-1/2 rounded-xl px-4 py-3 text-center text-sm text-primary">
          Could not load this model — {modelError}
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

      <div className="glass-panel absolute bottom-24 right-4 rounded-lg px-3 py-2 text-xs text-text-secondary">
        <p className="tabular">{stats.fps} fps</p>
        <p className="tabular">{stats.drawCalls} draw calls</p>
        <p className="tabular">{stats.activeMeshes} active meshes</p>
      </div>
    </div>
  );
}
