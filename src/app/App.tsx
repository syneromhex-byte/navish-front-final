import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@app/routes';
import { ErrorBoundary } from '@app/providers/ErrorBoundary';
import { useUserStore } from '@store/userStore';
import { apiClient } from '@services/apiClient';

function App() {
  const setSession = useUserStore((state) => state.setSession);
  const clearSession = useUserStore((state) => state.clearSession);
  const setInitializing = useUserStore((state) => state.setInitializing);

  useEffect(() => {
    let isMounted = true;

    const refreshToken = useUserStore.getState().refreshToken;

    // Only attempt silent refresh if we have credentials to try with
    if (!refreshToken && !useUserStore.getState().accessToken) {
      setInitializing(false);
      return;
    }

    apiClient
      .post<any>('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        if (!isMounted) return;
        const accessToken = data.accessToken ?? data.token;
        if (data.user && accessToken) {
          setSession(data.user, accessToken, data.refreshToken ?? refreshToken);
        } else if (accessToken) {
          setSession(
            useUserStore.getState().user!,
            accessToken,
            data.refreshToken ?? refreshToken,
          );
        }
      })
      .catch(() => {
        // Refresh failed — clear stale session so user sees the login page.
        if (isMounted) clearSession();
      })
      .finally(() => {
        if (isMounted) setInitializing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setSession, clearSession, setInitializing]);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
