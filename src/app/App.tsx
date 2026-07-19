import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@app/routes';
import { ErrorBoundary } from '@app/providers/ErrorBoundary';
import { useUserStore } from '@store/userStore';
import { authApi } from '@services/authApi';

function App() {
  const setSession = useUserStore((state) => state.setSession);
  const setInitializing = useUserStore((state) => state.setInitializing);

  useEffect(() => {
    let isMounted = true;

    authApi
      .refresh()
      .then((session) => {
        if (isMounted) setSession(session.user, session.accessToken);
      })
      .catch(() => {
        // No valid refresh cookie — user simply isn't signed in.
      })
      .finally(() => {
        if (isMounted) setInitializing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setSession, setInitializing]);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
