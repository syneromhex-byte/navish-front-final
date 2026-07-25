import {
  AbstractMesh,
  ParticlesOptimization,
  PostProcessesOptimization,
  RenderTargetsOptimization,
  SceneInstrumentation,
  SceneOptimizer,
  SceneOptimizerOptions,
} from '@babylonjs/core';
import type { AbstractEngine, Mesh, Scene } from '@babylonjs/core';
import type { EngineStats } from '@app-types/viewer.types';

export class OptimizationManager {
  private scene: Scene;
  private engine: AbstractEngine;
  private optimizer: SceneOptimizer | null = null;
  private instrumentation: SceneInstrumentation;

  constructor(scene: Scene, engine: AbstractEngine) {
    this.scene = scene;
    this.engine = engine;
    this.instrumentation = new SceneInstrumentation(scene);
  }

  /**
   * Starts Babylon's built-in step-down optimizer targeting a given FPS.
   *
   * Deliberately builds a custom step list instead of using
   * `SceneOptimizerOptions.ModerateDegradationAllowed` — every built-in
   * preset includes `MergeMeshesOptimization`, which combines and disposes
   * of the very meshes ObjectManager/SelectionManager/TransformManager hold
   * live references to, silently breaking selection and gizmos out from
   * under an editing user. None of the remaining steps touch mesh identity.
   */
  startAutoOptimize(targetFps = 60): void {
    this.stopAutoOptimize();
    const options = new SceneOptimizerOptions(targetFps);
    let priority = 0;
    options.addOptimization(new PostProcessesOptimization(priority));
    options.addOptimization(new ParticlesOptimization(priority));
    priority++;
    options.addOptimization(new RenderTargetsOptimization(priority));

    this.optimizer = new SceneOptimizer(this.scene, options);
    this.optimizer.start();
  }

  stopAutoOptimize(): void {
    this.optimizer?.stop();
    this.optimizer?.dispose();
    this.optimizer = null;
  }

  /** Distance-based LOD — pass increasingly simplified meshes with their switch distances. */
  registerLODLevels(sourceMesh: Mesh, levels: { distance: number; mesh: Mesh | null }[]): void {
    levels
      .sort((a, b) => a.distance - b.distance)
      .forEach((level) => sourceMesh.addLODLevel(level.distance, level.mesh));
  }

  /** GPU-instanced clone — cheap for repeated furniture/fixtures. */
  createInstance(sourceMesh: Mesh, name: string): AbstractMesh {
    return sourceMesh.createInstance(name);
  }

  enableOcclusionCulling(mesh: AbstractMesh): void {
    mesh.occlusionType = AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
    mesh.occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
    mesh.occlusionRetryCount = 2;
  }

  /** Lowers render resolution (not CSS size) under sustained frame-budget pressure. */
  setHardwareScalingLevel(level: number): void {
    this.engine.setHardwareScalingLevel(level);
  }

  getStats(): EngineStats {
    return {
      fps: Math.round(this.engine.getFps()),
      drawCalls: this.instrumentation.drawCallsCounter.current,
      activeMeshes: this.scene.getActiveMeshes().length,
    };
  }

  dispose(): void {
    this.stopAutoOptimize();
    this.instrumentation.dispose();
  }
}
