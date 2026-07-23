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
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => {
              const displayName = getClientDisplayName(client);
              const sharedModels = projects.filter(
                (project) => project.clientEmail?.toLowerCase() === client.email.toLowerCase(),
              );

              const registeredAtFormatted = client.createdAt
                ? new Date(client.createdAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'Recently registered';

              return (
                <div key={client.id} className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {displayName.slice(0, 1).toUpperCase() || '?'}
                      </div>
                      <span className="rounded-full bg-surface-hover px-2.5 py-1 text-[10px] font-medium text-text-tertiary">
                        {registeredAtFormatted}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-text-primary">{displayName}</p>
                    <p className="text-xs text-text-tertiary">{client.email}</p>
                    {client.company && (
                      <p className="mt-1 text-xs text-text-secondary">{client.company}</p>
                    )}
                    {client.projectType && (
                      <p className="mt-1 text-xs text-text-secondary">Project: {client.projectType}</p>
                    )}
                    {client.message && (
                      <div className="mt-2.5 rounded-lg bg-surface-hover/50 p-2.5 text-xs text-text-secondary border border-border-subtle">
                        <p className="font-medium text-text-primary text-[11px] mb-0.5">Inquiry Message:</p>
                        <p className="line-clamp-3 text-text-tertiary">{client.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-subtle">
                    {sharedModels.length > 0 ? (
                      <div className="flex flex-col gap-2">
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
                      <p className="tabular text-xs font-medium text-text-tertiary">
                        No models sent yet
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CONTACT INQUIRIES & RESPONSE HISTORY TABLE */}
          <div className="mt-12">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Contact Form Inquiries & Auto-Response Logs
            </h2>
            <p className="mt-1 text-xs text-text-tertiary">
              Complete history of received contact form entries with exact registration timestamps and automated email response status.
            </p>

            <div className="glass-panel mt-4 overflow-x-auto rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-subtle text-text-tertiary">
                    <th className="p-4 font-medium">Client / Lead</th>
                    <th className="p-4 font-medium">Registered Date & Time</th>
                    <th className="p-4 font-medium">Project Type</th>
                    <th className="p-4 font-medium">Message</th>
                    <th className="p-4 font-medium">Auto-Reply Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredClients.map((client) => {
                    const displayName = getClientDisplayName(client);
                    const timestamp = client.createdAt
                      ? new Date(client.createdAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'medium',
                        })
                      : 'N/A';

                    return (
                      <tr key={client.id} className="hover:bg-surface-hover/40 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold text-text-primary">{displayName}</p>
                          <p className="text-[11px] text-text-tertiary">{client.email}</p>
                        </td>
                        <td className="p-4 tabular text-text-secondary">{timestamp}</td>
                        <td className="p-4 text-text-secondary">{client.projectType || 'General Inquiry'}</td>
                        <td className="p-4 text-text-tertiary max-w-xs truncate">{client.message || 'No custom message provided.'}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Auto-Reply Sent (&quot;We will contact you sooner!&quot;)
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <a
                            href={`mailto:${client.email}?subject=RE: NAVISH ARC Inquiry&body=Hi ${displayName},%0D%0A%0D%0AThank you for reaching out to NAVISH ARC.`}
                          >
                            <Button variant="secondary" size="sm">
                              Reply via Email
                            </Button>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
