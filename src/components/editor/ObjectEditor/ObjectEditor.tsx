import { ObjectPanel } from '../ObjectPanel/ObjectPanel';
import { TransformPanel } from '../TransformPanel/TransformPanel';
import type { ObjectPanelProps } from '../ObjectPanel/ObjectPanel';
import type { TransformPanelProps } from '../TransformPanel/TransformPanel';

export interface ObjectEditorProps {
  panelProps: ObjectPanelProps;
  transformProps: TransformPanelProps;
}

export function ObjectEditor({ panelProps, transformProps }: ObjectEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <ObjectPanel {...panelProps} />
      <TransformPanel {...transformProps} />
    </div>
  );
}

export { ObjectPanel, TransformPanel };
