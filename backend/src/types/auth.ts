export type RegisterInput = {
  phone: string;
  password: string;
  name?: string;
};

export type LoginInput = {
  phone: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export type AuthUser = {
  id: string;
  phone: string;
  name?: string;
  role: 'customer' | 'farmer' | 'admin';
  farmerProfileId?: string;
};

