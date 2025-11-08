import { create } from 'zustand';

import { clearAuthSession, getAuthSession, saveAuthSession } from '../utils/secureStorage';

type AuthUser = {
  id: string;
  name?: string;
  phone: string;
  role: 'customer' | 'farmer' | 'admin';
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isBootstrapped: boolean;
  bootstrapError: Error | null;
  login: (payload: { user: AuthUser; token: string }) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isBootstrapped: false,
  bootstrapError: null,
  login: async ({ user, token }) => {
    set({ user, accessToken: token });
    await saveAuthSession({ user, token });
  },
  logout: async () => {
    set({ user: null, accessToken: null, bootstrapError: null });
    await clearAuthSession();
  },
  bootstrap: async () => {
    try {
      const session = await getAuthSession();
      if (session) {
        set({ user: session.user, accessToken: session.token });
      }
      set({ isBootstrapped: true, bootstrapError: null });
    } catch (error) {
      console.warn('bootstrap failed', error);
      set({
        isBootstrapped: true,
        bootstrapError: error instanceof Error ? error : new Error('Bootstrap failed'),
      });
    }
  },
}));

