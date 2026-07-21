import { Vector3 } from '@babylonjs/core';
import type { TransformNode } from '@babylonjs/core';
import type { ObjectPanelEntry } from '@components/editor/ObjectPanel/ObjectPanel';
import type { EngineManager } from '../core/EngineManager';
import type { SceneObjectCategory } from '../objects/ObjectManager';

export interface AutoCategorizeResult {
  entries: ObjectPanelEntry[];
  center: Vector3;
  radius: number;
}

/**
 * Heuristic floor/wall/furniture detection for an arbitrary loaded model.
 * The demo scene tags every mesh by hand, but a real uploaded model (walls,
 * floor, furniture, sofas, etc.) has no such metadata — this classifies
 * purely from each mesh's own bounding-box shape and its height relative to
 * the whole model, so it works for any reasonably conventional
 * architectural model rather than one specific scene: floors read as flat
 * and wide near the bottom, walls as tall and thin, everything else is
 * furniture. Floor/wall meshes get `checkCollisions = true` so Walk mode
 * can't pass through them.
 */
export function autoCategorizeModel(
  engineManager: EngineManager,
  root: TransformNode,
): AutoCategorizeResult {
  const meshes = root.getChildMeshes(false).filter((mesh) => mesh.getTotalVertices() > 0);
  if (meshes.length === 0) {
    return { entries: [], center: Vector3.Zero(), radius: 3 };
  }

  meshes.forEach((mesh) => {
    mesh.computeWorldMatrix(true);
    mesh.refreshBoundingInfo({});

    if (mesh.material) {
      mesh.material.backFaceCulling = false;
      const mat = mesh.material as any;
      if ('twoSidedLighting' in mat) mat.twoSidedLighting = true;
      if ('environmentIntensity' in mat && mat.environmentIntensity === 0) {
        mat.environmentIntensity = 1.0;
      }
      if (mat.subMaterials && Array.isArray(mat.subMaterials)) {
        mat.subMaterials.forEach((subMat: any) => {
          if (subMat) {
            subMat.backFaceCulling = false;
            if ('twoSidedLighting' in subMat) subMat.twoSidedLighting = true;
            if ('environmentIntensity' in subMat && subMat.environmentIntensity === 0) {
              subMat.environmentIntensity = 1.0;
            }
          }
        });
      }
    }
  });

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  meshes.forEach((mesh) => {
    const bb = mesh.getBoundingInfo().boundingBox;
    minX = Math.min(minX, bb.minimumWorld.x);
    minY = Math.min(minY, bb.minimumWorld.y);
    minZ = Math.min(minZ, bb.minimumWorld.z);
    maxX = Math.max(maxX, bb.maximumWorld.x);
    maxY = Math.max(maxY, bb.maximumWorld.y);
    maxZ = Math.max(maxZ, bb.maximumWorld.z);
  });
  const modelHeight = Math.max(maxY - minY, 0.01);
  const center = new Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
  const radius = Math.max(
    Vector3.Distance(new Vector3(minX, minY, minZ), new Vector3(maxX, maxY, maxZ)) / 2,
    1,
  );

  const entries: ObjectPanelEntry[] = meshes.map((mesh) => {
    const bb = mesh.getBoundingInfo().boundingBox;
    const width = Math.max(bb.maximumWorld.x - bb.minimumWorld.x, 0.001);
    const depth = Math.max(bb.maximumWorld.z - bb.minimumWorld.z, 0.001);
    const height = Math.max(bb.maximumWorld.y - bb.minimumWorld.y, 0.001);
    const horizontalSpan = Math.max(width, depth);
    const centerY = (bb.minimumWorld.y + bb.maximumWorld.y) / 2;
    const heightFromBottom = centerY - minY;

    let category: SceneObjectCategory;
    if (height < horizontalSpan * 0.15 && heightFromBottom < modelHeight * 0.2) {
      // Flat and wide, sitting at the bottom of the model.
      category = 'floor';
      mesh.checkCollisions = true;
    } else if (height > Math.min(width, depth) * 2 && height > modelHeight * 0.4) {
      // Tall relative to its own footprint, and thin in one horizontal direction.
      category = 'wall';
      mesh.checkCollisions = true;
    } else {
      category = 'furniture';
    }

    const entry = engineManager.objectManager.register(mesh, category);
    engineManager.lightManager.registerCaster(mesh);
    mesh.receiveShadows = true;
    return { id: entry.id, name: entry.name, category: entry.category };
  });

  return { entries, center, radius };
}
