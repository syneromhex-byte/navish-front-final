
import type { EngineManager } from '@engine/babylon/EngineManager';
import type { ObjectPanelEntry } from '@components/editor/ObjectPanel/ObjectPanel';
import type { Project } from '@app-types/project.types';
import type { LoadedModelMetadata, ModelLoadProgress } from '@app-types/viewer.types';
import { autoCategorizeModel } from '@engine/babylon/autoCategorizeModel';
import { getAuthorizedModelUrl, resolveServerUrl } from '@utils/resolveServerUrl';

import type { Vector3 } from '@babylonjs/core';

export interface ProjectSceneResult {
  entries: ObjectPanelEntry[];
  error: string | null;
  center?: Vector3;
  radius?: number;
  floorY?: number;
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
    mat.forceDepthWrite = true;
    if ('twoSidedLighting' in mat) {
      (mat as any).twoSidedLighting = true;
    }
  });

  const { entries, center, radius, floorY } = autoCategorizeModel(engineManager, root);
  engineManager.cameraManager.frameBounds(center, radius, floorY);
  engineManager.environmentManager.refreshReflections();
  engineManager.objectManager.captureInitialState();
  return { entries, error: null, center, radius, floorY };
}

export async function loadProjectScene(
  engineManager: EngineManager,
  project: Project | undefined,
  localFile?: File,
  localSiblingFiles?: File[],
  onProgress?: (progress: ModelLoadProgress) => void,
): Promise<ProjectSceneResult> {
  try {
    if (localFile) {
      const metadata = await engineManager.modelLoader.loadFromFile(
        localFile,
        onProgress,
        localSiblingFiles,
      );
      return await finishLoadedModel(engineManager, metadata);
    }

    const rawUrl = project?.fileUrl || project?.modelUrl;
    if (!rawUrl || rawUrl.startsWith('blob:')) {
      return {
        entries: [],
        error: null,
      };
    }

    const databaseModelId =
      project?.modelId ||
      project?.model_id ||
      (project?.id && !project.id.startsWith('port_') ? project.id : undefined);
    const resolvedUrl = (await getAuthorizedModelUrl(rawUrl, databaseModelId)) || resolveServerUrl(rawUrl);
    if (!resolvedUrl || resolvedUrl.includes('example.com') || resolvedUrl.startsWith('blob:')) {
      return {
        entries: [],
        error: null,
      };
    }

    const metadata = await engineManager.modelLoader.loadFromUrl(resolvedUrl, onProgress);
    return await finishLoadedModel(engineManager, metadata);
  } catch (err: any) {
    console.error('❌ Error loading 3D model scene:', err);
    return {
      entries: [],
      error: err?.message || 'Failed to load the 3D model file from the server.',
    };
  }
}
