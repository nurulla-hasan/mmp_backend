export interface IPublicUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'SURVEYOR' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  imageUrl: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
}

export interface IAuthResponse extends IAuthTokens {
  user: IPublicUser;
}
