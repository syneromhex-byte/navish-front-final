import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
      name: 'navish_user_session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

