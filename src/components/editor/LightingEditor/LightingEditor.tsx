import { LightingPanel } from '../LightingPanel/LightingPanel';
import type { LightingPanelProps } from '../LightingPanel/LightingPanel';

export type LightingEditorProps = LightingPanelProps;

export function LightingEditor(props: LightingEditorProps) {
  return <LightingPanel {...props} />;
}
export { LightingPanel };
