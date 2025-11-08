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
  login: (payload: { user: AuthUser; token: string }) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isBootstrapped: false,
  login: async ({ user, token }) => {
    set({ user, accessToken: token });
    await saveAuthSession({ user, token });
  },
  logout: async () => {
    set({ user: null, accessToken: null });
    await clearAuthSession();
  },
  bootstrap: async () => {
    const session = await getAuthSession();
    if (session) {
      set({ user: session.user, accessToken: session.token });
    }
    set({ isBootstrapped: true });
  },
}));

