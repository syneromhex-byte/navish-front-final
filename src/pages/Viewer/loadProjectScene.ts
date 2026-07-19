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

  const { entries, center, radius } = autoCategorizeModel(engineManager, root);
  engineManager.cameraManager.frameBounds(center, radius);
  engineManager.environmentManager.refreshReflections();
  return { entries, error: null };
}

/**
 * Loads whatever content a project should show, in priority order:
 * 1. A local file the admin just picked on the Projects page (preview-only,
 *    never persisted — see localModelStore).
 * 2. A real .glb/.gltf/.obj at `project.modelUrl` (set by an admin).
 * 3. Nothing — an empty room (sky + lighting only) with a message asking
 *    for a model to be linked, if neither of the above is available yet.
 *
 * Real models — local or by URL — get the same auto floor/wall/furniture
 * detection, shadow casting, and camera framing, so every tool
 * (material/lighting/environment/walk/VR) works on them.
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

    if (project?.modelUrl) {
      const metadata = await engineManager.modelLoader.loadFromUrl(project.modelUrl);
      return await finishLoadedModel(engineManager, metadata);
    }

    return { entries: [], error: 'No model has been linked to this project yet.' };
  } catch (err) {
    return {
      entries: [],
      error: err instanceof Error ? err.message : 'Could not load this model.',
    };
  }
}
