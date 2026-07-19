import { TexturePanel } from '../TexturePanel/TexturePanel';
import type { TexturePanelProps } from '../TexturePanel/TexturePanel';

export type TextureEditorProps = TexturePanelProps;

export function TextureEditor(props: TextureEditorProps) {
  return <TexturePanel {...props} />;
}
export { TexturePanel };
