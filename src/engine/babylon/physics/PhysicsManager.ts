import { HavokPlugin, PhysicsAggregate, PhysicsShapeType, Vector3 } from '@babylonjs/core';
import type { AbstractMesh, Scene } from '@babylonjs/core';

/**
 * Wraps Havok (WASM) physics. Distinct from the lightweight collision system
 * CameraManager uses for walk-mode (mesh.checkCollisions) — this is for real
 * rigid-body simulation: furniture that can be dropped, knocked over, etc.
 */
export class PhysicsManager {
  private scene: Scene;
  private isInitialized = false;
  private aggregates: PhysicsAggregate[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    const HavokPhysics = (await import('@babylonjs/havok')).default;
    const havokInstance = await HavokPhysics();
    const plugin = new HavokPlugin(true, havokInstance);
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), plugin);
    this.isInitialized = true;
  }

  /** Immovable collider — walls, floors, static geometry. */
  addStaticBody(mesh: AbstractMesh): PhysicsAggregate {
    const aggregate = new PhysicsAggregate(
      mesh,
      PhysicsShapeType.MESH,
      { mass: 0, friction: 0.6 },
      this.scene,
    );
    this.aggregates.push(aggregate);
    return aggregate;
  }

  /** Gravity-affected rigid body — furniture, props. */
  addDynamicBody(mesh: AbstractMesh, mass = 1): PhysicsAggregate {
    const aggregate = new PhysicsAggregate(
      mesh,
      PhysicsShapeType.BOX,
      { mass, friction: 0.5, restitution: 0.1 },
      this.scene,
    );
    this.aggregates.push(aggregate);
    return aggregate;
  }

  removeBody(aggregate: PhysicsAggregate): void {
    aggregate.dispose();
    this.aggregates = this.aggregates.filter((entry) => entry !== aggregate);
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    this.aggregates.forEach((aggregate) => aggregate.dispose());
    this.aggregates = [];
    if (this.isInitialized) {
      this.scene.disablePhysicsEngine();
    }
  }
}
