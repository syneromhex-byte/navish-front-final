import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Loader } from '@components/common';
import { useClients } from '@hooks/useClients';
import { useProjectStore } from '@store/projectStore';
import { ROUTES } from '@constants/routes';

const getClientDisplayName = (client: any): string => {
  if (!client) return 'Client';
  const name = client.name || client.displayName || client.user?.displayName || client.user?.name || '';
  if (name.trim()) return name;
  const first = client.firstName || client.user?.firstName || '';
  const last = client.lastName || client.user?.lastName || '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return client.email || client.user?.email || 'Client';
};

export default function Clients() {
  const { clients, isLoading } = useClients();
  const projects = useProjectStore((state) => state.projects);
  const [search, setSearch] = useState('');

  const filteredClients = clients.filter((client) => {
    const displayName = getClientDisplayName(client);
    return displayName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Clients</h1>

      <Input
        placeholder="Search clients…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-6 w-64"
      />

      {isLoading && clients.length === 0 ? (
        <div className="mt-10 flex justify-center py-12">
          <Loader />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-panel mt-6 rounded-2xl p-10 text-center">
          <p className="text-sm text-text-secondary">No clients yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const displayName = getClientDisplayName(client);
            const sharedModels = projects.filter(
              (project) => project.clientEmail?.toLowerCase() === client.email.toLowerCase(),
            );

            return (
              <div key={client.id} className="glass-panel rounded-2xl p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {displayName.slice(0, 1).toUpperCase() || '?'}
                </div>
                <p className="mt-3 text-sm font-semibold text-text-primary">{displayName}</p>
                <p className="text-xs text-text-tertiary">{client.email}</p>
                {client.company && (
                  <p className="mt-1 text-xs text-text-secondary">{client.company}</p>
                )}
                {client.projectType && (
                  <p className="mt-1 text-xs text-text-secondary">{client.projectType}</p>
                )}
                {client.message && (
                  <p className="mt-2 line-clamp-2 text-xs text-text-tertiary">{client.message}</p>
                )}

                {sharedModels.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2 border-t border-border-subtle pt-3">
                    <p className="text-xs font-medium text-text-secondary">Models sent to them</p>
                    {sharedModels.map((model) => (
                      <div key={model.id} className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-text-tertiary">{model.name}</p>
                        <Link to={ROUTES.viewer(model.id)}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="tabular mt-3 text-xs font-medium text-text-secondary">
                    No models sent yet
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
