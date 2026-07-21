import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Loader, StatusBadge } from '@components/common';
import { useProjects } from '@hooks/useProjects';
import { useUserStore } from '@store/userStore';
import { ROUTES } from '@constants/routes';
import { formatRelativeDate } from '@utils/format';

export default function MyModels() {
  const user = useUserStore((state) => state.user);
  const { projects, isLoading } = useProjects();

  const myModels = useMemo(() => {
    const userEmailNorm = user?.email?.toLowerCase();
    const userNameNorm = (user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`).trim().toLowerCase();
    const userIdNorm = user?.id;

    return projects.filter((project) => {
      const pEmail = project.clientEmail?.toLowerCase();
      const pName = project.clientName?.toLowerCase();
      const pClientId = project.clientId;

      return (
        (pEmail && userEmailNorm && pEmail === userEmailNorm) ||
        (pClientId && userIdNorm && pClientId === userIdNorm) ||
        (pName && userNameNorm && pName === userNameNorm)
      );
    });
  }, [projects, user]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Welcome{user?.firstName || user?.name ? `, ${(user.firstName || user.name)?.split(' ')[0]}` : ''}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        These are the 3D walkthroughs your architect has shared with you. Open one on this device,
        or step inside with a VR headset.
      </p>

      {isLoading ? (
        <div className="mt-12 flex justify-center py-12">
          <Loader size="lg" />
        </div>
      ) : myModels.length === 0 ? (
        <div className="glass-panel mt-8 rounded-2xl p-10 text-center">
          <p className="text-sm text-text-secondary">
            Nothing has been shared with you yet. Your architect will send a model here once it's
            ready.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {myModels.map((model) => (
            <div key={model.id} className="glass-panel flex flex-col rounded-2xl p-5 border border-border-subtle hover:scale-[1.01] transition-all">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg font-semibold text-text-primary">
                  {model.name}
                </p>
                <StatusBadge status={model.modelStatus || model.status} />
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
