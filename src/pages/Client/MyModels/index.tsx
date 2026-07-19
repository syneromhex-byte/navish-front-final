import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, StatusBadge } from '@components/common';
import { useProjectStore } from '@store/projectStore';
import { useUserStore } from '@store/userStore';
import { useLocalModelStore } from '@store/localModelStore';
import { ROUTES } from '@constants/routes';
import { formatRelativeDate } from '@utils/format';
import { pickPrimaryModelFile } from '@utils/pickPrimaryModelFile';

export default function MyModels() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const projects = useProjectStore((state) => state.projects);
  const setPendingLocalModel = useLocalModelStore((state) => state.setPending);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  const myModels = projects.filter(
    (project) => project.clientEmail?.toLowerCase() === user?.email.toLowerCase(),
  );

  // Nothing is uploaded anywhere — this loads the file straight into this
  // browser tab so you can look around your own model (walk, VR, the
  // works), without waiting on your architect to send one first. It won't
  // be saved or visible to anyone else. Multi-select so a .gltf's sibling
  // .bin/texture files can come along — without them, referenced textures
  // and geometry can't resolve and the model loads dark/incomplete.
  const handlePickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    const primary = pickPrimaryModelFile(files);
    if (!primary) {
      setPickError('Select a .glb, .gltf, or .obj file.');
      return;
    }
    setPickError(null);
    const previewId = `preview-${Date.now().toString(36)}`;
    setPendingLocalModel(previewId, primary, files);
    navigate(ROUTES.viewer(previewId));
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        These are the 3D walkthroughs your architect has shared with you. Open one on this device,
        or step inside with a VR headset.
      </p>

      <div className="glass-panel mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div>
          <p className="text-sm text-text-secondary">
            Have your own model file? View it right now, on this device. A single .glb works on
            its own — for .gltf, select its .bin file and texture images too.
          </p>
          {pickError && <p className="mt-1 text-xs text-primary">{pickError}</p>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf,.obj,.bin,.png,.jpg,.jpeg,.webp,.ktx2"
          multiple
          className="hidden"
          onChange={handlePickFile}
        />
        <Button variant="outline" size="md" onClick={() => fileInputRef.current?.click()}>
          Select a File to View
        </Button>
      </div>

      {myModels.length === 0 ? (
        <div className="glass-panel mt-8 rounded-2xl p-10 text-center">
          <p className="text-sm text-text-secondary">
            Nothing has been shared with you yet. Your architect will send a model here once it's
            ready.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {myModels.map((model) => (
            <div key={model.id} className="glass-panel flex flex-col rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg font-semibold text-text-primary">
                  {model.name}
                </p>
                <StatusBadge status={model.status} />
              </div>
              {model.sharedAt && (
                <p className="mt-1 text-xs text-text-tertiary">
                  Shared {formatRelativeDate(model.sharedAt)}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-2">
                <Link to={ROUTES.viewer(model.id)}>
                  <Button variant="primary" size="md" className="w-full">
                    View in 3D
                  </Button>
                </Link>
                <Link to={ROUTES.viewerVr(model.id)}>
                  <Button variant="outline" size="md" className="w-full">
                    View in VR
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
