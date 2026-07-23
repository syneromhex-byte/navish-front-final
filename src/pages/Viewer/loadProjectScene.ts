
import type { EngineManager } from '@engine/babylon/EngineManager';
import type { ObjectPanelEntry } from '@components/editor/ObjectPanel/ObjectPanel';
import type { Project } from '@app-types/project.types';
import type { LoadedModelMetadata } from '@app-types/viewer.types';
import { autoCategorizeModel } from '@engine/babylon/autoCategorizeModel';
import { resolveServerUrl } from '@utils/resolveServerUrl';

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
    mat.forceDepthWrite = true;
    if ('twoSidedLighting' in mat) {
      (mat as any).twoSidedLighting = true;
    }
  });

  const { entries, center, radius } = autoCategorizeModel(engineManager, root);
  engineManager.cameraManager.frameBounds(center, radius);
  engineManager.environmentManager.refreshReflections();
  return { entries, error: null };
}



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

    if (!project?.modelUrl || project.modelUrl.startsWith('blob:')) {
      return {
        entries: [],
        error: null,
      };
    }

    const resolvedUrl = resolveServerUrl(project.modelUrl);
    if (!resolvedUrl || resolvedUrl.includes('example.com') || resolvedUrl.startsWith('blob:')) {
      return {
        entries: [],
        error: null,
      };
    }

    const metadata = await engineManager.modelLoader.loadFromUrl(resolvedUrl);
    return await finishLoadedModel(engineManager, metadata);
  } catch (err: any) {
    return {
      entries: [],
      error: err?.message || 'Failed to load the 3D model file from the server.',
    };
  }
}
