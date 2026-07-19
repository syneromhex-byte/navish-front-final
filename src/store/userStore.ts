import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@app-types/user.types';

interface UserState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** True while session restoration (silent refresh on load) is in flight. */
  isInitializing: boolean;
  setSession: (user: User, accessToken: string, refreshToken?: string | null) => void;
  setAccessToken: (accessToken: string) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  clearSession: () => void;
  setInitializing: (isInitializing: boolean) => void;
}

// Persisted so a visitor stays signed in across page loads instead of
// re-authenticating every visit. This is acceptable ONLY because there's no
// real backend yet — `accessToken` here is never a genuine bearer
// credential (nothing privileged trusts it), just a local marker. Once a
// real auth API exists, switch back to an in-memory access token plus an
// httpOnly refresh-token cookie (the shape `apiClient.ts` already assumes)
// rather than persisting a real JWT to storage.
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitializing: true,
      setSession: (user, accessToken, refreshToken = null) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      setInitializing: (isInitializing) => set({ isInitializing }),
    }),
    {
      name: 'navish-arc-session',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
