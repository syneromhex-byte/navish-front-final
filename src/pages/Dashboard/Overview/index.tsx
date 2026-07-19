import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '@components/cards/StatCard';
import { StatusBadge, Loader, Button } from '@components/common';
import { useProjects } from '@hooks/useProjects';
import { useUserStore } from '@store/userStore';
import { useClientStore } from '@store/clientStore';
import { ROUTES } from '@constants/routes';
import { formatRelativeDate, formatBytes } from '@utils/format';
import { CreateProjectWizard } from '../Projects/CreateProjectWizard';

export default function Overview() {
  const { projects, isLoading } = useProjects();
  const user = useUserStore((state) => state.user);
  const clients = useClientStore((state) => state.clients);

  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const readyCount = projects.filter((project) => project.status === 'ready').length;

  // Calculates total optimized storage
  const totalStorage = projects.reduce((acc, p) => acc + (p.optimizedSize ?? p.sizeBytes ?? 0), 0);

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Here&apos;s a live review of your premium visualization space.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" onClick={() => setIsWizardOpen(true)}>
            New Project
          </Button>
          <Link to={ROUTES.dashboardProjects}>
            <Button variant="secondary" size="md">
              View Models
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Projects" value={projects.length} />
        <StatCard label="Ready to View" value={readyCount} />
        <StatCard label="Total Clients" value={clients.length} />
        <StatCard label="Disk Space Saved" value={formatBytes(totalStorage)} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Projects Table panel */}
        <div className="lg:col-span-2">
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
                <div key={project.id} className="flex items-center justify-between py-4 hover:bg-white/[0.01] transition-all px-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.name}
                        className="h-10 w-14 rounded-lg object-cover bg-black border border-border-subtle"
                      />
                    ) : (
                      <div className="h-10 w-14 rounded-lg bg-white/[0.04] border border-dashed border-border-subtle flex items-center justify-center text-[10px] text-text-tertiary">
                        No Preview
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-text-primary">{project.name}</p>
                      <p className="text-xs text-text-tertiary">{project.clientName || 'Not Shared'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-tertiary">
                      {formatRelativeDate(project.updatedAt)}
                    </span>
                    <StatusBadge status={project.modelStatus || project.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client summaries mini card */}
        <div className="rounded-2xl border border-border-subtle bg-white/[0.02] p-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h3 className="font-display font-semibold text-text-primary">Recent Clients</h3>
            <Link to={ROUTES.dashboardClients} className="text-xs text-text-secondary hover:text-primary">
              All Clients
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {clients.length === 0 ? (
              <p className="text-center py-6 text-xs text-text-tertiary">No registered clients.</p>
            ) : (
              clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {client.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-text-primary">{client.name}</p>
                    <p className="truncate text-[10px] text-text-tertiary">{client.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Multi-step New Project Creation Wizard */}
      <CreateProjectWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
}
