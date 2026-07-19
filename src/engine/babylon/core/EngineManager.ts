import { EngineFactory } from '@babylonjs/core/Engines/engineFactory';
import type { AbstractEngine, Scene } from '@babylonjs/core';
import { SceneManager } from '../scene/SceneManager';
import { CameraManager } from '../cameras/CameraManager';
import { LightManager } from '../lighting/LightManager';
import { ModelLoader } from '../loaders/ModelLoader';
import { OptimizationManager } from '../optimization/OptimizationManager';
import { ObjectManager } from '../objects/ObjectManager';
import { SelectionManager } from '../selection/SelectionManager';
import { MaterialManager } from '../materials/MaterialManager';
import { TextureManager } from '../materials/TextureManager';
import { TransformManager } from '../interactions/TransformManager';
import { EnvironmentManager } from '../scene/EnvironmentManager';
import { VRManager } from '../vr/VRManager';
import { GyroscopeManager } from '../cameras/GyroscopeManager';
import { PhysicsManager } from '../physics/PhysicsManager';
import { AnimationManager } from '../scene/AnimationManager';
import { GeoWalkManager } from '../interactions/GeoWalkManager';

export interface EngineManagerHandles {
  sceneManager: SceneManager;
  cameraManager: CameraManager;
  lightManager: LightManager;
  modelLoader: ModelLoader;
  optimizationManager: OptimizationManager;
  objectManager: ObjectManager;
  selectionManager: SelectionManager;
  materialManager: MaterialManager;
  textureManager: TextureManager;
  transformManager: TransformManager;
  environmentManager: EnvironmentManager;
  vrManager: VRManager;
  gyroscopeManager: GyroscopeManager;
  physicsManager: PhysicsManager;
  animationManager: AnimationManager;
  geoWalkManager: GeoWalkManager;
}

/**
 * Root of the engine layer. Owns the Babylon Engine + Scene lifecycle and the
 * render loop. Every other manager is constructed here, in dependency order,
 * and torn down here in reverse. Nothing in this file imports React.
 */
export class EngineManager {
  private engine: AbstractEngine | null = null;
  private canvas: HTMLCanvasElement;
  private resizeObserver: ResizeObserver | null = null;
  private isDisposed = false;

  sceneManager!: SceneManager;
  cameraManager!: CameraManager;
  lightManager!: LightManager;
  modelLoader!: ModelLoader;
  optimizationManager!: OptimizationManager;
  objectManager!: ObjectManager;
  selectionManager!: SelectionManager;
  materialManager!: MaterialManager;
  textureManager!: TextureManager;
  transformManager!: TransformManager;
  environmentManager!: EnvironmentManager;
  vrManager!: VRManager;
  gyroscopeManager!: GyroscopeManager;
  physicsManager!: PhysicsManager;
  animationManager!: AnimationManager;
  geoWalkManager!: GeoWalkManager;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initialize(): Promise<EngineManagerHandles> {
    this.engine = await EngineFactory.CreateAsync(this.canvas, {
      antialias: true,
      adaptToDeviceRatio: true,
      stencil: true,
      powerPreference: 'high-performance',
    });

    this.sceneManager = new SceneManager(this.engine);
    const scene = this.sceneManager.getScene();

    this.lightManager = new LightManager(scene);
    this.cameraManager = new CameraManager(scene, this.canvas);
    this.modelLoader = new ModelLoader(scene);
    this.optimizationManager = new OptimizationManager(scene, this.engine);
    this.objectManager = new ObjectManager();
    this.selectionManager = new SelectionManager(scene);
    this.selectionManager.enablePointerSelection(this.objectManager);
    this.materialManager = new MaterialManager(scene);
    this.textureManager = new TextureManager(scene);
    this.transformManager = new TransformManager(scene);
    this.environmentManager = new EnvironmentManager(scene);
    this.environmentManager.syncSunDirection(this.lightManager.getSunLight().direction);
    this.environmentManager.refreshReflections();
    this.vrManager = new VRManager(scene);
    this.gyroscopeManager = new GyroscopeManager(scene);
    this.physicsManager = new PhysicsManager(scene);
    this.animationManager = new AnimationManager(scene);
    this.geoWalkManager = new GeoWalkManager(scene);

    this.observeResize();

    return {
      sceneManager: this.sceneManager,
      cameraManager: this.cameraManager,
      lightManager: this.lightManager,
      modelLoader: this.modelLoader,
      optimizationManager: this.optimizationManager,
      objectManager: this.objectManager,
      selectionManager: this.selectionManager,
      materialManager: this.materialManager,
      textureManager: this.textureManager,
      transformManager: this.transformManager,
      environmentManager: this.environmentManager,
      vrManager: this.vrManager,
      gyroscopeManager: this.gyroscopeManager,
      physicsManager: this.physicsManager,
      animationManager: this.animationManager,
      geoWalkManager: this.geoWalkManager,
    };
  }

  startRenderLoop(): void {
    if (!this.engine) return;
    const scene = this.getScene();
    this.engine.runRenderLoop(() => {
      if (!this.isDisposed) scene.render();
    });
  }

  private observeResize(): void {
    this.resizeObserver = new ResizeObserver(() => this.engine?.resize());
    this.resizeObserver.observe(this.canvas);
  }

  getEngine(): AbstractEngine {
    if (!this.engine) throw new Error('EngineManager.initialize() has not resolved yet.');
    return this.engine;
  }

  getScene(): Scene {
    return this.sceneManager.getScene();
  }

  dispose(): void {
    this.isDisposed = true;
    this.resizeObserver?.disconnect();
    this.geoWalkManager?.dispose();
    this.animationManager?.dispose();
    this.physicsManager?.dispose();
    this.gyroscopeManager?.dispose();
    this.vrManager?.dispose();
    this.environmentManager?.dispose();
    this.transformManager?.dispose();
    this.textureManager?.dispose();
    this.materialManager?.dispose();
    this.selectionManager?.dispose();
    this.objectManager?.clear();
    this.modelLoader?.dispose();
    this.optimizationManager?.dispose();
    this.cameraManager?.dispose();
    this.lightManager?.dispose();
    this.sceneManager?.dispose();
    this.engine?.dispose();
  }
}
