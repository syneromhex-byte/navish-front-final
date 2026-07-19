import { Link } from 'react-router-dom';
import { StatCard } from '@components/cards/StatCard';
import { StatusBadge, Loader } from '@components/common';
import { useProjects } from '@hooks/useProjects';
import { useUserStore } from '@store/userStore';
import { ROUTES } from '@constants/routes';
import { formatRelativeDate } from '@utils/format';

export default function Overview() {
  const { projects, isLoading } = useProjects();
  const user = useUserStore((state) => state.user);

  const readyCount = projects.filter((project) => project.status === 'ready').length;
  const processingCount = projects.filter((project) => project.status === 'processing').length;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Here&apos;s what&apos;s happening across your projects.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Total Projects" value={projects.length} />
        <StatCard label="Ready to View" value={readyCount} />
        <StatCard label="Processing" value={processingCount} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text-primary">Recent Projects</h2>
          <Link
            to={ROUTES.dashboardProjects}
            className="text-sm font-medium text-text-secondary hover:text-primary"
          >
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-6 flex justify-center py-12">
            <Loader />
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel mt-6 rounded-2xl p-10 text-center">
            <p className="text-sm text-text-secondary">No projects yet.</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col divide-y divide-border-subtle border-t border-border-subtle">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">{project.name}</p>
                  <p className="text-xs text-text-tertiary">{project.clientName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-text-tertiary">
                    {formatRelativeDate(project.updatedAt)}
                  </span>
                  <StatusBadge status={project.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
