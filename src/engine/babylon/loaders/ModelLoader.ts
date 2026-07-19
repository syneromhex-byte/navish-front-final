import { FilesInputStore, Tags, TransformNode } from '@babylonjs/core';
import type {
  AbstractMesh,
  ISceneLoaderProgressEvent,
  Node,
  Scene,
} from '@babylonjs/core';
// Registers glTF/GLB + OBJ SceneLoader plugins. Draco-compressed geometry and
// KTX2/Basis-compressed textures inside a glTF are decoded automatically by
// these plugins — no extra wiring needed. Both decoders lazy-load their
// WASM/JS transcoders from Babylon's CDN (DracoCompression.Configuration /
// KhronosTextureContainer2.URLConfig) on first use; override those statics
// to self-host if an offline/air-gapped deployment ever needs it.
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import type {
  LoadedModelMetadata,
  ModelLoadProgress,
  ModelSourceFormat,
} from '@app-types/viewer.types';

export class ModelLoadError extends Error {}

const EXTENSION_FORMAT: Record<string, ModelSourceFormat> = {
  glb: 'glb',
  gltf: 'gltf',
  fbx: 'fbx',
  obj: 'obj',
};

function detectFormat(fileName: string): ModelSourceFormat {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const format = EXTENSION_FORMAT[extension];
  if (!format) {
    throw new ModelLoadError(`Unrecognized model extension: .${extension}`);
  }
  return format;
}

export class ModelLoader {
  private scene: Scene;
  private loadedRoots = new Map<string, TransformNode>();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * `.glb` is self-contained (geometry + textures embedded in one binary) and
   * loads from a single File with no extra work. `.gltf` is plain JSON that
   * references its geometry buffer and textures as separate sibling files by
   * relative path — Babylon can only resolve those from a local pick via its
   * FilesInputStore (a filename → File lookup it checks before falling back
   * to a network fetch), so every file from the same picker selection must be
   * registered there first, or those references silently fail and the model
   * loads with missing textures/geometry.
   */
  async loadFromFile(
    file: File,
    onProgress?: (progress: ModelLoadProgress) => void,
    siblingFiles: File[] = [],
  ): Promise<LoadedModelMetadata> {
    const format = detectFormat(file.name);
    this.assertBrowserLoadable(format);

    siblingFiles.forEach((sibling) => {
      FilesInputStore.FilesToLoad[sibling.name.toLowerCase()] = sibling;
    });

    // An empty rootUrl makes the loader resolve sibling references (a
    // .gltf's .bin/textures) as plain relative paths, which the browser
    // then fetches over HTTP against the current page URL instead of
    // checking FilesInputStore — the "file:" scheme is what routes that
    // resolution through the local-file lookup instead.
    const result = await SceneLoader.ImportMeshAsync(null, 'file:', file, this.scene, (event) =>
      this.reportProgress(event, onProgress),
    );

    return this.finalizeImport(file.name, format, result.meshes, result.transformNodes);
  }

  async loadFromUrl(
    url: string,
    onProgress?: (progress: ModelLoadProgress) => void,
  ): Promise<LoadedModelMetadata> {
    const fileName = url.split('/').pop() ?? url;
    const format = detectFormat(fileName);
    this.assertBrowserLoadable(format);

    const rootUrl = url.slice(0, url.length - fileName.length);
    const result = await SceneLoader.ImportMeshAsync(null, rootUrl, fileName, this.scene, (event) =>
      this.reportProgress(event, onProgress),
    );

    return this.finalizeImport(fileName, format, result.meshes, result.transformNodes);
  }

  /**
   * FBX has no native WebGL/browser parser in Babylon (or any major web 3D
   * engine) — production pipelines (Sketchfab, Autodesk Viewer) convert FBX
   * to glTF server-side before it ever reaches the client. We surface that
   * clearly instead of failing silently or pretending to support it.
   */
  private assertBrowserLoadable(
    format: ModelSourceFormat,
  ): asserts format is 'glb' | 'gltf' | 'obj' {
    if (format === 'fbx') {
      throw new ModelLoadError(
        'FBX files must be converted to glTF/GLB before they can be loaded in the browser viewer. Contact your pipeline admin about server-side conversion.',
      );
    }
  }

  private reportProgress(
    event: ISceneLoaderProgressEvent,
    onProgress?: (progress: ModelLoadProgress) => void,
  ): void {
    if (!onProgress || !event.lengthComputable) return;
    onProgress({
      loaded: event.loaded,
      total: event.total,
      percent: Math.round((event.loaded / event.total) * 100),
    });
  }

  private finalizeImport(
    fileName: string,
    format: ModelSourceFormat,
    meshes: AbstractMesh[],
    transformNodes: TransformNode[] = [],
  ): LoadedModelMetadata {
    const root = new TransformNode(`model_${fileName}_${Date.now()}`, this.scene);
    Tags.AddTagsTo(root, 'navishModelRoot');

    // A loaded asset's meshes are often nested several levels deep under an
    // intermediate "__root__" TransformNode the loader creates to group
    // multiple top-level glTF nodes — that node has no parent, but the real
    // meshes inside it do, so filtering `meshes` alone for parentless items
    // misses everything and the whole model silently registers as empty.
    // Reparenting every parentless node (mesh or transform) from either list
    // catches single-mesh assets, multi-root assets, and wrapped assets alike.
    const topLevel: Node[] = [...meshes, ...transformNodes].filter((node) => !node.parent);
    topLevel.forEach((node) => {
      (node as AbstractMesh | TransformNode).setParent(root);
    });

    let boundingRadius = 0;
    meshes.forEach((mesh) => {
      mesh.refreshBoundingInfo({});
      const radius = mesh.getBoundingInfo().boundingSphere.radiusWorld;
      if (radius > boundingRadius) boundingRadius = radius;
    });

    const materialCount = new Set(
      meshes.map((mesh) => mesh.material?.uniqueId).filter((id): id is number => id !== undefined),
    ).size;

    this.loadedRoots.set(root.uniqueId.toString(), root);

    return {
      rootId: root.uniqueId.toString(),
      fileName,
      format,
      meshCount: meshes.length,
      materialCount,
      boundingRadius,
    };
  }

  getRoot(rootId: string): TransformNode | undefined {
    return this.loadedRoots.get(rootId);
  }

  unload(rootId: string): void {
    const root = this.loadedRoots.get(rootId);
    if (!root) return;
    root.getChildMeshes().forEach((mesh) => mesh.dispose(false, true));
    root.dispose();
    this.loadedRoots.delete(rootId);
  }

  unloadAll(): void {
    Array.from(this.loadedRoots.keys()).forEach((rootId) => this.unload(rootId));
  }

  dispose(): void {
    this.unloadAll();
  }
}
