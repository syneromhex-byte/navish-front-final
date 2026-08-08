import { EnvironmentPanel } from '../EnvironmentPanel/EnvironmentPanel';
import type { EnvironmentPanelProps } from '../EnvironmentPanel/EnvironmentPanel';

export type EnvironmentEditorProps = EnvironmentPanelProps;

export function EnvironmentEditor(props: EnvironmentEditorProps) {
  return <EnvironmentPanel {...props} />;
}
export { EnvironmentPanel };
