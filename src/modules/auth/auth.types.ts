export interface IUserLocation {
  district: string;
  upazila: string;
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
