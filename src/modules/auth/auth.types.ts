export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'SURVEYOR' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  imageUrl: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
