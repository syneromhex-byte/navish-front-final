const MODEL_EXTENSIONS = ['.glb', '.gltf', '.obj'];

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
