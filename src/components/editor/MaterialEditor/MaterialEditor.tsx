import { MaterialPanel } from '../MaterialPanel/MaterialPanel';
import type { MaterialPanelProps } from '../MaterialPanel/MaterialPanel';

export type MaterialEditorProps = MaterialPanelProps;

export function MaterialEditor(props: MaterialEditorProps) {
  return <MaterialPanel {...props} />;
}
export { MaterialPanel };
