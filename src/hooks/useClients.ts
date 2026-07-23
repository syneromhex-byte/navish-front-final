import { useEffect, useState } from 'react';
import { projectApi } from '@services/projectApi';
import { useClientStore } from '@store/clientStore';
import { useUserStore } from '@store/userStore';

export function useClients() {
  const storeClients = useClientStore((state) => state.clients);
  const addClientFromRegistration = useClientStore((state) => state.addClientFromRegistration);
  const currentUser = useUserStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    projectApi
      .listClients()
      .then((data) => {
        if (!isMounted || !Array.isArray(data)) return;
        data.forEach((c: any) => {
          const role = (c.role || c.user?.role)?.toLowerCase();
          if (role && role !== 'client' && role !== 'viewer') return;

          const email = c.email || c.user?.email;
          const name =
            c.name ||
            c.displayName ||
            c.user?.displayName ||
            `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim() ||
            'Client';
          if (email) {
            addClientFromRegistration({ name, email });
          }
        });
      })
      .catch(() => {
        // Fallback to store clients when backend is offline
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [addClientFromRegistration]);

  const filteredClients = storeClients.filter((client) => {
    const isCurrentUser = client.email.toLowerCase() === currentUser?.email?.toLowerCase();
    const isCurrentAdmin =
      isCurrentUser &&
      (currentUser?.role?.toLowerCase() === 'admin' ||
        currentUser?.role?.toLowerCase() === 'architect');
    return !isCurrentAdmin;
  });

  return { clients: filteredClients, isLoading };
}
