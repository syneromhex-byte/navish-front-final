import { Color3, MeshBuilder, PBRMaterial } from '@babylonjs/core';
import type { Scene } from '@babylonjs/core';
import type { ObjectPanelEntry } from '@components/editor/ObjectPanel/ObjectPanel';
import type { EngineManager } from '@engine/babylon/EngineManager';

/**
 * Builds a small procedural room, registering each mesh with ObjectManager so
 * the ObjectPanel/SelectionManager have real objects to work with. Replaced
 * by ModelLoader-driven content once a project is wired up. Shared between
 * ViewerPage and VRPage so both preview the same space.
 */
export function buildDemoScene(engineManager: EngineManager): ObjectPanelEntry[] {
  const scene: Scene = engineManager.getScene();
  const entries: ObjectPanelEntry[] = [];

  const floorMaterial = new PBRMaterial('floorMaterial', scene);
  floorMaterial.albedoColor = new Color3(0.55, 0.5, 0.45);
  floorMaterial.roughness = 0.7;
  floorMaterial.metallic = 0;
  const floor = MeshBuilder.CreateGround('Floor', { width: 12, height: 12 }, scene);
  floor.material = floorMaterial;
  floor.receiveShadows = true;
  floor.checkCollisions = true;
  entries.push(toEntry(engineManager, floor, 'floor'));

  const wallMaterial = new PBRMaterial('wallMaterial', scene);
  wallMaterial.albedoColor = new Color3(0.92, 0.91, 0.88);
  wallMaterial.roughness = 0.9;
  wallMaterial.metallic = 0;

  const backWall = MeshBuilder.CreateBox('Back Wall', { width: 12, height: 4, depth: 0.2 }, scene);
  backWall.position.set(0, 2, 6);
  backWall.material = wallMaterial;
  backWall.checkCollisions = true;
  entries.push(toEntry(engineManager, backWall, 'wall'));

  const sideWall = MeshBuilder.CreateBox('Side Wall', { width: 0.2, height: 4, depth: 12 }, scene);
  sideWall.position.set(-6, 2, 0);
  sideWall.material = wallMaterial;
  sideWall.checkCollisions = true;
  entries.push(toEntry(engineManager, sideWall, 'wall'));

  const furnitureMaterial = new PBRMaterial('furnitureMaterial', scene);
  furnitureMaterial.albedoColor = new Color3(0.55, 0.09, 0.09);
  furnitureMaterial.roughness = 0.35;
  furnitureMaterial.metallic = 0.1;

  const block = MeshBuilder.CreateBox('Bench', { width: 2, height: 0.9, depth: 1 }, scene);
  block.position.set(0, 0.45, 0);
  block.material = furnitureMaterial;
  block.receiveShadows = true;
  entries.push(toEntry(engineManager, block, 'furniture'));

  // Distance-based LOD: swap to a coarser stand-in once the bench is far enough
  // to make the detail imperceptible.
  const benchLowDetail = MeshBuilder.CreateBox(
    'Bench_LOD1',
    { width: 2, height: 0.9, depth: 1 },
    scene,
  );
  benchLowDetail.material = furnitureMaterial;
  benchLowDetail.setEnabled(false);
  engineManager.optimizationManager.registerLODLevels(block, [
    { distance: 25, mesh: benchLowDetail },
  ]);

  // GPU-instanced stools — cheap repeated geometry sharing the bench's draw call.
  const stoolMaterial = new PBRMaterial('stoolMaterial', scene);
  stoolMaterial.albedoColor = new Color3(0.15, 0.15, 0.17);
  stoolMaterial.roughness = 0.5;
  stoolMaterial.metallic = 0.2;
  const stoolSource = MeshBuilder.CreateBox('Stool Source', { size: 0.4 }, scene);
  stoolSource.material = stoolMaterial;
  stoolSource.setEnabled(false);

  const stoolPositions = [
    { x: 3, z: 4 },
    { x: -3, z: 4 },
    { x: 3, z: -4 },
    { x: -3, z: -4 },
  ];
  stoolPositions.forEach((pos, index) => {
    const stool = engineManager.optimizationManager.createInstance(
      stoolSource,
      `Stool ${index + 1}`,
    );
    stool.position.set(pos.x, 0.2, pos.z);
    stool.receiveShadows = true;
    entries.push(toEntry(engineManager, stool, 'furniture'));
  });

  [floor, backWall, sideWall, block].forEach((mesh) =>
    engineManager.lightManager.registerCaster(mesh),
  );
  engineManager.cameraManager.frameBounds(block.position.clone(), 6);

  return entries;
}

function toEntry(
  engineManager: EngineManager,
  mesh: Parameters<EngineManager['objectManager']['register']>[0],
  category: ObjectPanelEntry['category'],
): ObjectPanelEntry {
  const entry = engineManager.objectManager.register(mesh, category);
  return { id: entry.id, name: entry.name, category: entry.category };
}
