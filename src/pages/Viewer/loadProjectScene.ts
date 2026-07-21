import { Color3, MeshBuilder, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import type { EngineManager } from '@engine/babylon/EngineManager';
import type { ObjectPanelEntry } from '@components/editor/ObjectPanel/ObjectPanel';
import type { Project } from '@app-types/project.types';
import type { LoadedModelMetadata } from '@app-types/viewer.types';
import { autoCategorizeModel } from '@engine/babylon/autoCategorizeModel';

export interface ProjectSceneResult {
  entries: ObjectPanelEntry[];
  error: string | null;
}

async function finishLoadedModel(
  engineManager: EngineManager,
  metadata: LoadedModelMetadata,
): Promise<ProjectSceneResult> {
  const root = engineManager.modelLoader.getRoot(metadata.rootId);
  if (!root) {
    return { entries: [], error: 'Model loaded but could not be found in the scene.' };
  }

  engineManager.getScene().materials.forEach((mat) => {
    mat.backFaceCulling = false;
    if ('twoSidedLighting' in mat) {
      (mat as any).twoSidedLighting = true;
    }
  });

  const { entries, center, radius } = autoCategorizeModel(engineManager, root);
  engineManager.cameraManager.frameBounds(center, radius);
  engineManager.environmentManager.refreshReflections();
  return { entries, error: null };
}

function createDefaultStudioScene(engineManager: EngineManager): ProjectSceneResult {
  const scene = engineManager.getScene();
  const root = new TransformNode(`procedural_studio_${Date.now()}`, scene);

  // Floor
  const floor = MeshBuilder.CreateGround('floor_mesh', { width: 14, height: 14 }, scene);
  floor.setParent(root);
  const floorMat = new StandardMaterial('floorMat', scene);
  floorMat.diffuseColor = new Color3(0.18, 0.20, 0.24);
  floorMat.specularColor = new Color3(0.1, 0.1, 0.1);
  floor.material = floorMat;

  // Back Wall
  const wallBack = MeshBuilder.CreatePlane('wall_back_mesh', { width: 14, height: 6 }, scene);
  wallBack.position = new Vector3(0, 3, 7);
  wallBack.rotation = new Vector3(0, Math.PI, 0);
  wallBack.setParent(root);
  const wallMat = new StandardMaterial('wallMat', scene);
  wallMat.diffuseColor = new Color3(0.25, 0.28, 0.35);
  wallBack.material = wallMat;

  // Left Wall
  const wallLeft = MeshBuilder.CreatePlane('wall_left_mesh', { width: 14, height: 6 }, scene);
  wallLeft.position = new Vector3(-7, 3, 0);
  wallLeft.rotation = new Vector3(0, Math.PI / 2, 0);
  wallLeft.setParent(root);
  wallLeft.material = wallMat;

  // Center Pedestal
  const pedestal = MeshBuilder.CreateBox('pedestal_mesh', { width: 3.5, height: 1, depth: 3.5 }, scene);
  pedestal.position = new Vector3(0, 0.5, 0);
  pedestal.setParent(root);
  const pedestalMat = new StandardMaterial('pedestalMat', scene);
  pedestalMat.diffuseColor = new Color3(0.85, 0.65, 0.25);
  pedestal.material = pedestalMat;

  const { entries, center, radius } = autoCategorizeModel(engineManager, root);
  engineManager.cameraManager.frameBounds(center, Math.max(radius, 6));
  engineManager.environmentManager.refreshReflections();

  return { entries, error: null };
}

/**
 * Loads whatever content a project should show, in priority order:
 * 1. A local file the admin just picked on the Projects page (preview-only,
 *    never persisted — see localModelStore).
 * 2. A real .glb/.gltf/.obj at `project.modelUrl` (set by an admin).
 * 3. Procedural 3D studio room scene if no valid custom model URL exists.
 */
export async function loadProjectScene(
  engineManager: EngineManager,
  project: Project | undefined,
  localFile?: File,
  localSiblingFiles?: File[],
): Promise<ProjectSceneResult> {
  try {
    if (localFile) {
      const metadata = await engineManager.modelLoader.loadFromFile(
        localFile,
        undefined,
        localSiblingFiles,
      );
      return await finishLoadedModel(engineManager, metadata);
    }

    if (project?.modelUrl && !project.modelUrl.includes('example.com')) {
      try {
        const metadata = await engineManager.modelLoader.loadFromUrl(project.modelUrl);
        return await finishLoadedModel(engineManager, metadata);
      } catch (urlErr) {
        // Fall back to 3D studio room if remote model URL fails to load
        return createDefaultStudioScene(engineManager);
      }
    }

    // Default 3D room scene when no custom model is linked
    return createDefaultStudioScene(engineManager);
  } catch (err) {
    return createDefaultStudioScene(engineManager);
  }
}
