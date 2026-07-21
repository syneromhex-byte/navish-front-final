import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@app-types/user.types';

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

// The access token is persisted so App.tsx can attempt a silent refresh
// on page load. The backend uses an httpOnly cookie for the refresh token,
// so we do NOT persist refreshToken in localStorage.
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitializing: true,
      setSession: (user, accessToken, refreshToken = null) =>
        set({
          user: user ? { ...user, role: (user.role?.toLowerCase() ?? 'client') as UserRole } : null,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
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
        // refreshToken is NOT persisted — backend sets it in an httpOnly cookie
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
