const MODEL_EXTENSIONS = ['.glb', '.gltf', '.obj', '.fbx', '.skp', '.3ds'];

/**
 * Picks the actual model file out of a multi-file selection (the rest being
 * a .gltf's sibling .bin/textures) so callers don't need to know the
 * supported extensions themselves.
 */
export function pickPrimaryModelFile(files: File[]): File | undefined {
  return files.find((file) =>
    MODEL_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)),
  );
}

/** File extensions accepted by the model upload system. */
export const SUPPORTED_MODEL_EXTENSIONS = MODEL_EXTENSIONS;

/** Human-readable format list for display in the upload UI. */
export const SUPPORTED_FORMATS_LABEL = 'GLB, GLTF, FBX, OBJ, SKP, 3DS';

/** Maximum upload file size in bytes (500 MB). */
export const MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024;
