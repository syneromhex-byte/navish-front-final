import { useEffect, useState } from 'react';
import { projectApi } from '@services/projectApi';
import { useClientStore } from '@store/clientStore';

export function useClients() {
  const storeClients = useClientStore((state) => state.clients);
  const addClientFromRegistration = useClientStore((state) => state.addClientFromRegistration);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    projectApi
      .listClients()
      .then((data) => {
        if (!isMounted || !Array.isArray(data)) return;
        data.forEach((c: any) => {
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

  return { clients: storeClients, isLoading };
}
