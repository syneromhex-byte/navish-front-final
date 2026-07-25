import { GizmoManager } from '@babylonjs/core';
import type { AbstractMesh, Scene } from '@babylonjs/core';
import type { ToolMode } from '@store/editorStore';

export interface TransformValues {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

const POSITION_SNAP = 0.1;
const ROTATION_SNAP = Math.PI / 24; // 7.5°
const SCALE_SNAP = 0.05;

/**
 * Wraps Babylon's GizmoManager. We drive attachment manually (rather than
 * GizmoManager's built-in click-to-attach) so it composes cleanly with our
 * own SelectionManager instead of fighting it for pointer events.
 */
export class TransformManager {
  private gizmoManager: GizmoManager;

  constructor(scene: Scene) {
    this.gizmoManager = new GizmoManager(scene);
    this.gizmoManager.usePointerToAttachGizmos = false;
    this.gizmoManager.positionGizmoEnabled = false;
    this.gizmoManager.rotationGizmoEnabled = false;
    this.gizmoManager.scaleGizmoEnabled = false;
    this.applySnapping();
  }

  setToolMode(mode: ToolMode): void {
    this.gizmoManager.positionGizmoEnabled = mode === 'move';
    this.gizmoManager.rotationGizmoEnabled = mode === 'rotate';
    this.gizmoManager.scaleGizmoEnabled = mode === 'scale';
    this.applySnapping();
  }

  attachToMesh(mesh: AbstractMesh | null): void {
    this.gizmoManager.attachToMesh(mesh);
  }

  private applySnapping(): void {
    const gizmos = this.gizmoManager.gizmos;
    if (gizmos.positionGizmo) gizmos.positionGizmo.snapDistance = POSITION_SNAP;
    if (gizmos.rotationGizmo) gizmos.rotationGizmo.snapDistance = ROTATION_SNAP;
    if (gizmos.scaleGizmo) gizmos.scaleGizmo.snapDistance = SCALE_SNAP;
  }

  getTransform(mesh: AbstractMesh): TransformValues {
    const rotation = mesh.rotationQuaternion
      ? mesh.rotationQuaternion.toEulerAngles()
      : mesh.rotation;
    return {
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      rotation: {
        x: (rotation.x * 180) / Math.PI,
        y: (rotation.y * 180) / Math.PI,
        z: (rotation.z * 180) / Math.PI,
      },
      scale: { x: mesh.scaling.x, y: mesh.scaling.y, z: mesh.scaling.z },
    };
  }

  setPositionAxis(mesh: AbstractMesh, axis: 'x' | 'y' | 'z', value: number): void {
    mesh.position[axis] = value;
  }

  setRotationAxisDegrees(mesh: AbstractMesh, axis: 'x' | 'y' | 'z', degrees: number): void {
    const radians = (degrees * Math.PI) / 180;
    if (mesh.rotationQuaternion) {
      const euler = mesh.rotationQuaternion.toEulerAngles();
      euler[axis] = radians;
      mesh.rotationQuaternion = euler.toQuaternion();
    } else {
      mesh.rotation[axis] = radians;
    }
  }

  setScaleAxis(mesh: AbstractMesh, axis: 'x' | 'y' | 'z', value: number): void {
    mesh.scaling[axis] = Math.max(value, 0.01);
  }

  dispose(): void {
    this.gizmoManager.dispose();
  }
}
