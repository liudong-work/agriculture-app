import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

type StoredSession = {
  token: string;
  user: {
    id: string;
    phone: string;
    name?: string;
    role: 'customer' | 'farmer' | 'admin';
    farmerProfileId?: string;
  };
};

export async function saveAuthSession(session: StoredSession) {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, session.token);
  await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(session.user));
}

export async function getAuthSession(): Promise<StoredSession | null> {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  const userRaw = await SecureStore.getItemAsync(AUTH_USER_KEY);

  if (!token || !userRaw) {
    return null;
  }

  try {
    const user = JSON.parse(userRaw);
    if (!user.role) {
      user.role = 'customer';
    }
    return { token, user };
  } catch (error) {
    console.warn('Failed to parse stored user payload', error);
    await clearAuthSession();
    return null;
  }
}

export async function clearAuthSession() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(AUTH_USER_KEY);
}

