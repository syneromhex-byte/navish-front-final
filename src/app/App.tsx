import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@app/routes';
import { ErrorBoundary } from '@app/providers/ErrorBoundary';
import { useUserStore } from '@store/userStore';
import { authApi } from '@services/auth/authApi';

const safeBase64Decode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

// Helper to decode JWT and check expiration
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payloadBlock = parts[1];
    if (!payloadBlock) return true;
    const jsonStr = safeBase64Decode(payloadBlock);
    const payload = JSON.parse(jsonStr);
    if (!payload || typeof payload.exp !== 'number') return true;
    // Check if within 15 seconds of expiration (clock skew)
    return payload.exp < Math.floor(Date.now() / 1000) + 15;
  } catch {
    return true;
  }
};

function App() {
  const setAccessToken = useUserStore((state) => state.setAccessToken);
  const clearSession = useUserStore((state) => state.clearSession);
  const setInitializing = useUserStore((state) => state.setInitializing);

  useEffect(() => {
    let isMounted = true;

    const { accessToken, isAuthenticated } = useUserStore.getState();

    // If we have a valid, unexpired access token, we can bypass silent refresh.
    if (isAuthenticated && accessToken && !isTokenExpired(accessToken)) {
      setInitializing(false);
      return;
    }

    // If there is no previous session, don't attempt silent refresh.
    if (!isAuthenticated) {
      setInitializing(false);
      return;
    }

    // Attempt silent refresh using HttpOnly cookie
    authApi
      .refresh()
      .then(({ accessToken: newToken }) => {
        if (isMounted) setAccessToken(newToken);
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
  }, [setAccessToken, clearSession, setInitializing]);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
